import { isEqual } from 'lodash';
import { EventTimeline } from 'matrix-js-sdk';
import { InteractionManager } from 'react-native';
import { BehaviorSubject } from 'rxjs';
import User from './User';

import matrix from '../services/matrix';
import messages from '../services/message';
import users from '../services/user';
import Message, { MessageStatus } from './Message';
import i18n from '../utilities/i18n';

const debug = require('debug')('rnm:scenes:chat:Chat');

const TYPING_TIMEOUT = 1000 * 15; // 15s

export const ChatDetails = {
  // All the info shown in DirectChatLists
  SUMMARY: {
    direct: true,
    state: true,
    timeline: true,
    receipt: true,
  },
  // All the info shown in ChatScreen
  ALL: {
    direct: true,
    state: true,
    timeline: true,
    receipt: true,
    messages: { all: true },
  },
};

export default class Chat {
  constructor(roomId, matrixRoom) {
    this.id = this.key = roomId;

    if (!matrixRoom) {
      this._matrixRoom = matrix.getClient().getRoom(roomId);
      if (!this._matrixRoom) throw Error(`Could not find matrix room with roomId ${roomId}`);
    } else this._matrixRoom = matrixRoom;

    this._ephemeral = {
      typing: { active: false, timer: null },
    };
    this._pending = [];

    this.name$ = new BehaviorSubject(this._matrixRoom.name);
    this.isDirect$ = new BehaviorSubject(this._isDirect());
    this.avatar$ = new BehaviorSubject(this._getAvatar());
    this.typing$ = new BehaviorSubject([]);
    this.messages$ = new BehaviorSubject(this._getMessages());
    this.snippet$ = new BehaviorSubject(this._getSnippet());
    this.readState$ = new BehaviorSubject(this._getReadState());
    this.atStart$ = new BehaviorSubject(this._isAtStart());
    this.members$ = new BehaviorSubject(this._getMembers());
  }

  //* *******************************************************************************
  // Data
  //* *******************************************************************************
  removePendingMessage(id) {
    const messageIndex = this._pending.findIndex((messageId) => messageId === id);
    if (messageIndex !== -1) this._pending.splice(messageIndex, 1);
  }

  async update(changes) {
    return InteractionManager.runAfterInteractions(() => {
      if (changes.direct) {
        const newDirect = this._isDirect();
        if (this.isDirect$.getValue() !== newDirect) this.isDirect$.next(newDirect);
      }

      if (changes.state || changes.direct) {
        const newName = this._matrixRoom.name;
        if (this.name$.getValue() !== newName) this.name$.next(newName);

        const newAvatar = this._getAvatar();
        if (this.avatar$.getValue() !== newAvatar) this.avatar$.next(newAvatar);
      }

      if (changes.timeline) {
        const newMessages = this._getMessages();
        if (!isEqual(this.messages$.getValue(), newMessages)) {
          this.messages$.next(newMessages);
          messages.cleanupRoomMessages(this.id, newMessages);
        }

        const newAtStart = this._isAtStart();
        if (this.atStart$.getValue() !== newAtStart) this.atStart$.next(newAtStart);
      }

      if (changes.typing) {
        let changed = false;
        const myUserId = matrix.getClient().getUserId();
        const oldTyping = this.typing$.getValue();
        const newTyping = [];

        for (const userId of changes.typing) {
          if (userId !== myUserId) {
            if (oldTyping[newTyping.length] !== userId) changed = true;
            newTyping.push(userId);
          }
        }
        if (oldTyping.length !== newTyping.length) changed = true;

        if (changed) this.typing$.next(newTyping);
      }

      if (changes.typing || changes.timeline) {
        const newSnippet = this._getSnippet();
        if (this.snippet$.getValue().content !== newSnippet.content) {
          this.snippet$.next(newSnippet);
        }
      }

      if (changes.receipt || changes.timeline) {
        const newReadState = this._getReadState();
        if (this.readState$.getValue() !== newReadState) this.readState$.next(newReadState);
      }

      if (changes.messages) {
        if (changes.messages.all) messages.updateRoomMessages(this.id);
        else {
          for (const eventId of Object.keys(changes.messages)) {
            messages.updateMessage(eventId, this.id);
          }
        }
      }
    });
  }

  _getAvatar() {
    const roomState = this._matrixRoom.getLiveTimeline().getState(EventTimeline.FORWARDS);
    const avatarEvent = roomState.getStateEvents('m.room.avatar', '');
    let avatar = avatarEvent ? avatarEvent.getContent().url : null;

    if (!avatar && this.isDirect$.getValue()) {
      const fallbackMember = this._matrixRoom.getAvatarFallbackMember();
      avatar = fallbackMember ? matrix.getClient().getUser(fallbackMember.userId)?.avatarUrl : null;
    }
    return avatar;
  }

  _getMessages() {
    const chatMessages = [];
    const roomEvents = this._matrixRoom.getLiveTimeline().getEvents();

    for (const roomEvent of roomEvents) {
      if (Message.isEventDisplayed(roomEvent)) {
        chatMessages.unshift(roomEvent.getId());
      }
    }

    const pendingEvents = this._matrixRoom.getPendingEvents();
    for (const pendingEvent of pendingEvents) {
      if (Message.isEventDisplayed(pendingEvent)) {
        chatMessages.unshift(pendingEvent.getId());
      }
    }

    const localPendingMessages = this._pending;
    for (const pendingMessageId of localPendingMessages) {
      chatMessages.unshift(pendingMessageId);
    }

    return chatMessages;
  }

  _getReadState() {
    const latestMessage = this.messages$.getValue()[0];

    if (!this._matrixRoom.hasUserReadEvent(matrix.getClient().getUserId(), latestMessage)) {
      return 'unread';
    }

    for (const member of this._matrixRoom.getJoinedMembers()) {
      if (!this._matrixRoom.hasUserReadEvent(member.userId, latestMessage)) {
        return 'readByMe';
      }
    }

    return 'readByAll';
  }

  _getSnippet() {
    const snippet = {};
    const chatMessages = this.messages$.getValue();
    const lastMessage = messages.getMessageById(chatMessages[0], this.id);

    snippet.timestamp = lastMessage?.timestamp;

    const typing = this.typing$.getValue();
    if (typing.length > 0) {
      const user = users.getUserById(typing[0]);
      if (typing.length > 1) {
        snippet.content = i18n.t('messages:content.groupTyping', {
          user1: user.name$.getValue(),
          others: typing.length - 1,
        });
      } else {
        snippet.content = i18n.t('messages:content.typing', { name: user.name$.getValue() });
      }
    } else {
      if (lastMessage) {
        if (this.isDirect$?.getValue()) {
          snippet.content = lastMessage.content$.getValue().text;
        } else {
          snippet.content = `${lastMessage.sender.name$.getValue()}: ${
            lastMessage.content$.getValue().text
          }`;
        }
      }
    }

    return snippet;
  }

  _isAtStart() {
    const start = !this._matrixRoom.getLiveTimeline().getPaginationToken(EventTimeline.BACKWARDS);

    return start;
  }

  _isDirect() {
    try {
      const directEvent = matrix.getClient().getAccountData('m.direct');
      const aDirectRooms = directEvent ? Object.values(directEvent.getContent()) : [];
      let directRooms = [];
      for (const array of aDirectRooms) {
        directRooms = [...directRooms, ...array];
      }
      if (directRooms.length > 0 && directRooms.includes(this.id)) return true;

      return false;
    } catch (e) {
      debug('Error in _isDirect', e);
    }
  }

  getMembers() {
    return this.members$.getValue();
  }

  _getMembers() {
    const members = [];
    for (const member of this._matrixRoom.getJoinedMembers()) {
      members.push(new User(member.userId));
    }
    return members;
  }

  isEncrypted() {
    return matrix.getClient().isRoomEncrypted(this.id);
  }

  //* *******************************************************************************
  // Actions
  //* *******************************************************************************
  async leave() {
    try {
      await matrix.getClient().leave(this.id);
    } catch (e) {
      debug('Error leaving room %s:', this.id, e);
    }

    await matrix.getClient().forget(this.id);
  }

  async fetchPreviousMessages() {
    try {
      // TODO: Improve this and gaps detection
      await matrix
        .getClient()
        .paginateEventTimeline(this._matrixRoom.getLiveTimeline(), { backwards: true });

      this.update({ timeline: true });
    } catch (e) {
      debug('Error fetching previous messages for chat %s', this.id, e);
    }
  }

  async sendMessage(content, type) {
    switch (type) {
      case 'm.image': {
        // Add or get pending message
        const event = {
          type,
          timestamp: Date.now(),
          status: MessageStatus.UPLOADING,
          content: content,
        };
        const pendingMessage = messages.getMessageById(`~~${this.id}:image`, this.id, event, true);
        // If it's already pending, we update the status, otherwise we add it
        if (this._pending.includes(pendingMessage.id)) {
          debug('Pending message already existed');
          pendingMessage.update({ status: MessageStatus.UPLOADING });
        } else {
          debug('Pending message created');
          this._pending.push(pendingMessage.id);
          this.update({ timeline: true });
        }

        // Upload image
        const response = await matrix.uploadImage(content);
        debug('uploadImage response', response);

        if (!response) {
          // TODO: handle upload error
          pendingMessage.update({ status: MessageStatus.NOT_UPLOADED });
          const txt = i18n.t('messages:content.contentNotUploadedNotice');
          return {
            error: 'CONTENT_NOT_UPLOADED',
            message: txt,
          };
        } else content.url = response;
        break;
      }
      case 'm.file': {
        // Add or get pending message
        const event = {
          type,
          timestamp: Date.now(),
          status: MessageStatus.UPLOADING,
          content: content,
        };
        const pendingMessage = messages.getMessageById(`~~${this.id}:file`, this.id, event, true);
        // If it's already pending, we update the status, otherwise we add it
        if (this._pending.includes(pendingMessage.id)) {
          debug('Pending message already existed');
          pendingMessage.update({ status: MessageStatus.UPLOADING });
        } else {
          debug('Pending message created');
          this._pending.push(pendingMessage.id);
          this.update({ timeline: true });
        }

        // Upload image
        const mxcUrl = await matrix.uploadContent(content);

        if (!mxcUrl) {
          // TODO: handle upload error
          pendingMessage.update({ status: MessageStatus.NOT_UPLOADED });
          const txt = i18n.t('messages:content.contentNotUploadedNotice');
          return {
            error: 'CONTENT_NOT_UPLOADED',
            message: txt,
          };
        } else content.url = mxcUrl;
        break;
      }
      default:
    }
    return messages.send(content, type, this.id);
  }

  sendReply(relatedMessage, message) {
    return messages.sendReply(this.id, relatedMessage, message);
  }

  async sendPendingEvents() {
    const matrixPendingEvents = this._matrixRoom.getPendingEvents();
    for (const pendingEvent of matrixPendingEvents) {
      if (pendingEvent.getAssociatedStatus() === MessageStatus.NOT_SENT) {
        await matrix.getClient().resendEvent(pendingEvent, this._matrixRoom);
      }
    }

    for (const pendingMessageId of this._pending) {
      const pendingMessage = messages.getMessageById(pendingMessageId, this.id);
      if (pendingMessage.status$.getValue() === MessageStatus.NOT_UPLOADED) {
        await this.sendMessage(
          pendingMessage.content$.getValue().raw,
          pendingMessage.type$.getValue()
        );
      }
    }
  }

  async sendReadReceipt() {
    const latestMessage = this.messages$.getValue()[0];
    const readState = this._getReadState();
    if (readState === 'unread') {
      const matrixEvent = this._matrixRoom.findEventById(latestMessage);
      await matrix.getClient().sendReadReceipt(matrixEvent);
    }
  }

  async setTyping(typing) {
    const state = this._ephemeral.typing;
    if (!state.timer && typing && !state.active) {
      // We were not typing or the timeout is almost reached
      state.timer = setTimeout(() => {
        state.timer = null;
        state.active = false;
      }, TYPING_TIMEOUT);
      state.active = true;
      matrix.getClient().sendTyping(this.id, true, TYPING_TIMEOUT + 5000);
    } else if (!typing && state.active) {
      // We were typing
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      state.active = false;
      matrix.getClient().sendTyping(this.id, false);
    }
  }

  setName(newName) {
    this.name$.next(newName);
    matrix.getClient().setRoomName(this.id, newName);
  }

  async setAvatar(image) {
    const url = await matrix.uploadImage(image);
    this.avatar$.next(url);
    return matrix.getClient().sendEvent(this.id, 'm.room.avatar', url);
  }

  //* *******************************************************************************
  // Helpers
  //* *******************************************************************************
  getAvatarUrl(size) {
    if (this.avatar$.getValue() == null) return null;
    try {
      return matrix.getImageUrl(this.avatar$.getValue(), size, size, 'crop');
    } catch (e) {
      debug('Error in getAvatarUrl', e);
      return null;
    }
  }
}
