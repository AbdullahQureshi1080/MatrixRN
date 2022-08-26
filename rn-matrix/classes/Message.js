import { isEqual } from 'lodash';
import { EventStatus } from 'matrix-js-sdk';
import { BehaviorSubject } from 'rxjs';

const THUMBNAIL_MAX_SIZE = 250;

import matrix from '../services/matrix';
import users from '../services/user';
import messages from '../services/message';
import i18n from '../utilities/i18n';

const debug = require('debug')('rnm:classes:Message');

// This is to add our own statuses on top of matrix's
export const MessageStatus = {
  ...EventStatus,
  // The content of the message (file) is uploading
  UPLOADING: 'uploading',
  // The content of the message could not be uploaded
  NOT_UPLOADED: 'not_uploaded',
};

export default class Message {
  constructor(eventId, roomId, event, pending = false) {
    this.id = this.key = eventId;
    this.roomId = roomId;

    if (!pending) {
      if (!event) {
        if (roomId) {
          const matrixRoom = matrix.getClient().getRoom(roomId);
          const roomEvents = matrixRoom.getLiveTimeline().getEvents();
          const roomEvent = roomEvents.find((event) => event.getId() === eventId);
          if (roomEvent) {
            this._matrixEvent = roomEvent;
          } else if (matrixRoom.hasPendingEvent(eventId)) {
            const pendingEvents = matrixRoom.getPendingEvents();
            this._matrixEvent = pendingEvents.find((event) => event.getId() === eventId);
          }
        }
        if (!this._matrixEvent) {
          console.warn(`No event in room ${roomId} with id ${eventId}`);
          return;
          // throw Error(`No event in room ${roomId} with id ${eventId}`);
        }
      } else this._matrixEvent = event;

      this.sender = users.getUserById(this._matrixEvent.getSender());
      this.timestamp = this._matrixEvent.getTs();
      this.type$ = new BehaviorSubject(Message.getType(this._matrixEvent));
      this.status$ = new BehaviorSubject(this._matrixEvent.getAssociatedStatus());
      this.redacted$ = new BehaviorSubject(this._matrixEvent.isRedacted());
      this.content$ = new BehaviorSubject(this._getContent());
      this.reactions$ = new BehaviorSubject(this._getReactions());
      this.receipts$ = new BehaviorSubject(this._getReceipts());
    } else {
      if (!event) throw Error(`All local messages should have an event (${this.id})`);

      this.pending = true;
      this._localEvent = event;

      this.sender = users.getMyUser();
      this.timestamp = event.timestamp;
      this.type$ = new BehaviorSubject(event.type);
      this.status$ = new BehaviorSubject(event.status);
      this.redacted$ = new BehaviorSubject(null);
      this.content$ = new BehaviorSubject(this._getContent());
      this.reactions$ = new BehaviorSubject(null);
    }
  }

  //* *******************************************************************************
  // Data
  //* *******************************************************************************
  async addReaction(key) {
    try {
      const reaction = {
        'm.relates_to': {
          rel_type: 'm.annotation',
          event_id: this.id,
          key: key,
        },
      };
      await matrix.getClient().sendEvent(this.roomId, 'm.reaction', reaction);
      this.update();
    } catch (e) {
      console.warn('Error sending reaction: ', { message: this, key }, e);
    }
  }

  async removeReaction(key) {
    try {
      const reactions = this.reactions$.getValue();
      const eventId = reactions[key][matrix.getClient().getUserId()].eventId;
      await matrix.getClient().redactEvent(this.roomId, eventId);
      this.update();
    } catch (e) {
      console.warn('Error removing reaction: ', { message: this, key }, e);
    }
  }

  async toggleReaction(key) {
    try {
      const reactions = this.reactions$.getValue();
      const reaction = reactions[key][matrix.getClient().getUserId()];
      if (reaction) return this.removeReaction(key);
      else return this.addReaction(key);
    } catch (e) {
      if (this.addReaction) {
        this.addReaction(key);
      } else {
        console.warn(e);
      }
    }
  }

  update(changes) {
    if (!this.pending) {
      if (this.type$.getValue() === 'm.room.encrypted') {
        this.type$.next(Message.getType(this._matrixEvent));
      }

      const newRedacted = this._matrixEvent.isRedacted();
      if (this.redacted$.getValue() !== newRedacted) this.redacted$.next(newRedacted);

      const newStatus = this._matrixEvent.getAssociatedStatus();
      if (this.status$.getValue() !== newStatus) {
        this.status$.next(newStatus);
      }

      const newContent = this._getContent();
      try {
        if (!isEqual(this.content$.getValue(), newContent)) {
          this.content$.next(newContent);
        }
      } catch (e) {
        console.log('Callstack exceeded.');
        this.content$.next(newContent);
      }

      const newReactions = this._getReactions();
      try {
        if (!isEqual(this.reactions$.getValue(), newReactions)) {
          this.reactions$.next(newReactions);
        }
      } catch (e) {
        console.log('Callstack exceeded.');
        this.reactions$.next(newReactions);
      }

      const newReceipts = this._getReceipts();
      try {
        if (!isEqual(this.receipts$.getValue(), newReceipts)) {
          this.receipts$.next(newReceipts);
        }
      } catch (e) {
        console.log('Callstack exceeded.');
        this.receipts$.next(newReceipts);
      }
    } else {
      if (changes.status && this.status$.getValue() !== changes.status) {
        this.status$.next(changes.status);
      }
    }
  }

  _getContent() {
    const content = {};
    if (this.pending) {
      content.raw = this._localEvent.content;
    } else {
      content.raw = this._matrixEvent.getContent();
    }
    if (this.redacted$.getValue()) {
      content.text = i18n.t('messages:content.eventRedacted');
      return content;
    }
    const sender = this.sender.name$.getValue();

    switch (this.type$ ? this.type$.getValue() : null) {
      // TextMessage && NoticeMessage
      case 'm.text':
      case 'm.notice':
        content.text = content.raw.body;
        if (content.raw.format === 'org.matrix.custom.html') {
          content.html = content.raw.formatted_body;
        } else {
          content.html = content.raw.body;
        }
        break;
      // ImageMessage
      case 'm.image': {
        content.text = i18n.t('messages:content.imageSent', { sender });

        if (this.pending) {
          // TODO: create thumb to free memory?
          content.full = {
            width: content.raw.width,
            height: content.raw.height,
            url: content.raw.uri,
          };
          content.thumb = {
            url: content.full.url,
          };
        } else {
          content.full = {
            height: content.raw.info.h,
            width: content.raw.info.w,
            url: matrix.getImageUrl(content.raw.url),
          };
          content.thumb = {
            url: matrix.getImageUrl(content.raw.url, THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE),
          };
        }
        // TODO: different sizes in constants or something
        const { height, width } = content.full;
        if (width > height) {
          content.thumb.height = (height * THUMBNAIL_MAX_SIZE) / width;
          content.thumb.width = THUMBNAIL_MAX_SIZE;
        } else {
          content.thumb.height = THUMBNAIL_MAX_SIZE;
          content.thumb.width = (width * THUMBNAIL_MAX_SIZE) / height;
        }
        break;
      }
      // EventMessages
      // Unsupported for now
      case 'm.audio':
        content.text = i18n.t('messages:content.audioNotSupport');
        break;
      // Video Message
      case 'm.video':
        // todo: localize
        content.text = `${sender} has sent a video`;
        if (this.pending) {
          //
        } else {
          content.full = {
            height: content.raw.info.h,
            width: content.raw.info.w,
          };
          content.thumb = {
            url: matrix.getHttpUrl(
              content.raw.info.thumbnail_url,
              THUMBNAIL_MAX_SIZE,
              THUMBNAIL_MAX_SIZE
            ),
          };
          content.type = content.raw.info.mimetype;
          content.url = matrix.getHttpUrl(content.raw.url);
        }
        const { height, width } = content.full;
        if (width > height) {
          content.thumb.height = (height * THUMBNAIL_MAX_SIZE) / width;
          content.thumb.width = THUMBNAIL_MAX_SIZE;
        } else {
          content.thumb.height = THUMBNAIL_MAX_SIZE;
          content.thumb.width = (width * THUMBNAIL_MAX_SIZE) / height;
        }
        break;
      case 'm.file':
        content.text = `${sender} has sent a file`;
        content.url = matrix.getHttpUrl(content.raw.url);
        content.name = content.raw.body;
        break;
      case 'm.location':
        content.text = i18n.t('messages:content.locationSharingNotSupport');
        break;
      case 'm.sticker':
        content.text = i18n.t('messages:content.stickersNotSupport');
        break;
      // Supported
      case 'm.room.encrypted':
      case 'm.bad.encrypted':
        content.text = i18n.t('messages:content.badEncryption');
        break;
      case 'm.emote':
        content.text = `${sender} ${content.raw.body}`;
        break;
      case 'm.room.member': {
        const prevContent = this._matrixEvent.getPrevContent();
        if (prevContent.membership !== content.raw.membership) {
          switch (content.raw.membership) {
            case 'invite':
              content.text = i18n.t('messages:content.memberInvited', {
                sender: sender,
                user: content.raw.displayname,
              });
              break;
            case 'join':
              content.text = i18n.t('messages:content.memberJoined', { sender: sender });
              break;
            case 'leave':
              content.text = i18n.t('messages:content.memberLeft', { sender: sender });
              break;
            default:
              content.text = i18n.t('messages:content.membershipNotSupport', {
                membership: content.raw.membership,
              });
              break;
          }
        } else if (prevContent.avatar_url !== content.raw.avatar_url) {
          if (!content.raw.avatar_url) {
            content.text = i18n.t('messages:content.memberAvatarRemoved', { sender: sender });
          } else {
            content.text = i18n.t('messages:content.memberAvatarChanged', { sender: sender });
          }
        } else if (prevContent.displayname !== content.raw.displayname) {
          const prevSender = prevContent.displayname || this.sender.id;
          const newSender = content.raw.displayname || this.sender.id;
          content.text = i18n.t('messages:content.memberDisplayNameChanged', {
            prevSender: prevSender,
            newSender: newSender,
          });
        }
        break;
      }
      case 'm.room.third_party_invite':
        content.text = i18n.t('messages:content.thirdPartyInvite', { sender: sender });
        break;
      case 'm.room.create':
        content.text = i18n.t('messages:content.chatCreated', { sender: sender });
        break;
      case 'm.room.name':
        content.text = i18n.t('messages:content.chatNameChanged', {
          sender: sender,
          name: content.raw.name,
        });
        break;
      case 'm.room.avatar':
        content.text = i18n.t('messages:content.chatAvatarChanged', { sender: sender });
        break;
      case 'm.room.topic':
        content.text = i18n.t('messages:content.chatDescriptionChanged', { sender: sender });
        break;
      case 'm.room.encryption':
      case 'm.room.guest_access':
      case 'm.room.history_visibility':
      case 'm.room.join_rules':
      case 'm.room.power_levels':
        content.text = i18n.t('messages:content.chatSettingsChanged', { sender: sender });
        break;
      default:
        content.text = i18n.t('messages:content.typeNotSupport', { type: this.type$.getValue() });
        break;
    }
    return content;
  }

  _getReactions() {
    const matrixRoom = matrix.getClient().getRoom(this.roomId);
    const eventReactions = matrixRoom
      .getUnfilteredTimelineSet()
      .getRelationsForEvent(this.id, 'm.annotation', 'm.reaction');
    const sortedReactions = eventReactions?.getSortedAnnotationsByKey();
    if (sortedReactions && sortedReactions.length > 0) {
      const reactions = {};
      for (const [key, events] of sortedReactions) {
        if (events.size > 0) {
          const users = {};
          for (const event of events) {
            users[event.getSender()] = {
              eventId: event.getId(),
              timestamp: event.getTs(),
            };
          }
          reactions[key] = users;
        }
      }
      if (Object.keys(reactions).length === 0) return;
      return reactions;
    }
  }

  _getReceipts() {
    const matrixRoom = matrix.getClient().getRoom(this.roomId);
    const receipts = matrixRoom.getReceiptsForEvent(this._matrixEvent);
    // receipts.forEach((receipt) => {
    //   const user = users.getUserById(receipt.userId);
    //   const avatar = user.avatar$.getValue();
    //   const avatarUrl = matrix.getImageUrl(avatar, 20, 20);
    //   receipt.avatar = avatarUrl;
    //   receipt.name = user.name$.getValue();

    //   // Update receipts on the previous message this user saw
    //   const prevReceiptMessageId = messages.getReceiptMessageIdForUser(receipt.userId);
    //   messages.updateMessage(prevReceiptMessageId, this.roomId);
    //   messages.setReceiptMessageIdForUser(receipt.userId, this.id);
    // });
    return receipts;
  }

  //* *******************************************************************************
  // Helpers
  //* *******************************************************************************
  getMatrixEvent() {
    return this._matrixEvent;
  }

  setMatrixEvent(event) {
    this._matrixEvent = event;
  }

  static getType(matrixEvent) {
    const type = matrixEvent.getType();
    if (matrixEvent.isRedacted()) {
      return type;
    }
    if (type === 'm.room.message') {
      return matrixEvent.getContent().msgtype;
    }
    return type;
  }

  static isBubbleMessage(message) {
    if (
      Message.isTextMessage(message.type$?.getValue()) ||
      Message.isImageMessage(message.type$?.getValue()) ||
      Message.isVideoMessage(message.type$?.getValue()) ||
      Message.isFileMessage(message.type$?.getValue()) ||
      Message.isNoticeMessage(message.type$?.getValue())
    ) {
      return true;
    }
  }

  static isEventDisplayed(matrixEvent) {
    const type = Message.getType(matrixEvent);
    if (Message.isMessageUpdate(matrixEvent)) {
      return false;
    }
    if (
      Message.isTextMessage(type) ||
      Message.isEventMessage(type) ||
      Message.isImageMessage(type) ||
      Message.isVideoMessage(type) ||
      Message.isFileMessage(type) ||
      Message.isNoticeMessage(type)
    ) {
      return true;
    }
    // To debug unhandled types
    switch (type) {
      default:
        // debug('Unhandled matrix event type "%s"', type, matrixEvent);
        return true;
    }
  }

  static isEventMessage(type) {
    switch (type) {
      case 'm.emote':
      case 'm.room.member':
      case 'm.room.create':
      case 'm.room.name':
      case 'm.room.avatar':
      case 'm.room.topic':
      case 'm.room.encryption':
      case 'm.room.guest_access':
      case 'm.room.history_visibility':
      case 'm.room.join_rules':
      case 'm.room.power_levels':
      case 'm.room.message':
      case 'm.room.third_party_invite':
        return true;
      // Below are other messages unsupported for now but still displayed as events
      case 'm.audio':
      case 'm.location':
      case 'm.sticker':
        return true;
      default:
        return false;
    }
  }

  static isImageMessage(type) {
    if (type === 'm.image') return true;
    return false;
  }

  static isVideoMessage(type) {
    if (type === 'm.video') return true;
    return false;
  }

  static isFileMessage(type) {
    if (type === 'm.file') return true;
    return false;
  }

  static isMessageUpdate(matrixEvent) {
    if (matrixEvent.isRedaction()) return true;
    if (matrixEvent.getType() === 'm.reaction') return true;

    if (matrixEvent.getType() === 'm.room.message') {
      const content = matrixEvent.getContent();
      if (content['m.relates_to'] && content['m.relates_to'].rel_type === 'm.replace') {
        return true;
      }
    }
    return false;
  }

  static isNoticeMessage(type) {
    if (type === 'm.notice') return true;
    return false;
  }

  static isTextMessage(type) {
    if (type === 'm.text') return true;
    return false;
  }
}
