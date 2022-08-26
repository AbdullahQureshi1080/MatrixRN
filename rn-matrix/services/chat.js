import { InteractionManager } from 'react-native';
import { BehaviorSubject } from 'rxjs';

// import matrix from '../../services/matrix/matrixService';
// import { route$ } from '../../services/navigation/navigationService';
// import Message from './message/Message';
// import messages from './message/messageService';

import Chat, { ChatDetails } from '../classes/Chat';
import matrix from './matrix';
import users from './user';
import messages from './message';
import Message from '../classes/Message';

const debug = require('debug')('rnm:scenes:chat:chatService');

class ChatService {
  constructor() {
    this._chats = {
      all: {},
      all$: new BehaviorSubject([]),
      direct$: new BehaviorSubject([]),
      group$: new BehaviorSubject([]),
      invites$: new BehaviorSubject([]),
    };
    this._syncList = {};
    this._opened = null;

    matrix.isReady$().subscribe((isReady) => {
      if (isReady) {
        this._listen();
        this._setOpened('all');
      }
    });
    matrix.isSynced$().subscribe((isSynced) => {
      if (isSynced) this._catchup();
    });

    // route$.subscribe(route => {
    //   if (route) {
    //     if (route.name === 'Chat') {
    //       this._setOpened(route.params.chatId);
    //     } else if (['Messages', 'Groups'].includes(route.name)) {
    //       this._setOpened('all');
    //     } else {
    //       this._setOpened(null);
    //     }
    //   }
    // });
  }

  getChats() {
    return this._chats.all$;
  }

  getListByType$(type) {
    if (type === 'invites') return this._chats.invites$;
    if (type === 'direct') return this._chats.direct$;
    return this._chats.group$;
  }

  getChatById(roomId) {
    if (!this._chats.all[roomId]) {
      const matrixRoom = matrix.getClient().getRoom(roomId);
      this._chats.all[roomId] = new Chat(roomId, matrixRoom);
    }
    return this._chats.all[roomId];
  }

  joinRoom(roomId) {
    matrix.getClient().joinRoom(roomId);
  }

  leaveRoom(roomId) {
    matrix.getClient().leave(roomId);
  }

  //* *******************************************************************************
  // Data
  //* *******************************************************************************
  async updateLists(updateChats = false) {
    return InteractionManager.runAfterInteractions(() => {
      let matrixRooms = [];
      let chats = [];
      const directChats = [];
      const groupChats = [];
      const invites = [];
      const prevChats = Object.keys(this._chats.all);

      const me = users.getMyUser();

      try {
        matrixRooms = matrix.getClient().getVisibleRooms();
      } catch (e) {
        debug('Error in getListByType', e.message);
      }

      for (const matrixRoom of matrixRooms) {
        let chat = this._chats.all[matrixRoom.roomId];
        if (!chat) {
          chat = new Chat(matrixRoom.roomId, matrixRoom);
          this._chats.all[matrixRoom.roomId] = chat;
        } else if (updateChats) {
          chat.update(ChatDetails.SUMMARY);
        }
        if (matrixRoom.hasMembershipState(me.id, 'invite')) {
          invites.push(chat);
        } else if (matrixRoom.hasMembershipState(me.id, 'join')) {
          chats.push(chat);
          if (chat.isDirect$.getValue()) directChats.push(chat);
          else groupChats.push(chat);
        }

        // Will be used to remove chats that have been removed
        const prevChatIndex = prevChats.find((roomId) => roomId === chat.id);
        if (parseInt(prevChatIndex) !== -1) prevChats.splice(parseInt(prevChatIndex), 1);
      }

      chats = chats.sort((a, b) => {
        return b.snippet$.getValue()?.timestamp - a.snippet$.getValue()?.timestamp;
      });
      this._chats.all$.next(chats);

      this._chats.invites$.next(invites);

      directChats.sort(this.sortChatsByLastMessage);
      groupChats.sort(this.sortChatsByLastMessage);

      if (!this.isEqualById(directChats, this._chats.direct$.getValue())) {
        this._chats.direct$.next(directChats);
      }
      if (!this.isEqualById(groupChats, this._chats.group$.getValue())) {
        this._chats.group$.next(groupChats);
      }
      if (prevChats.length > 0) {
        for (const roomId of prevChats) {
          delete this._chats.all[roomId];
        }
      }
    });
  }

  async _catchup() {
    // Send pending events
    for (const chat of Object.values(this._chats.all)) {
      await chat.sendPendingEvents();
    }
  }

  _handleAccountDataEvent(event) {
    // if (this._isNotSubscribedTo('all')) return;

    switch (event.getType()) {
      case 'm.direct':
        for (const roomId of Object.keys(this._chats.all)) {
          if (!this._syncList[roomId]) this._syncList[roomId] = {};
          this._syncList[roomId].direct = true;
        }
        break;
      default:
    }
  }

  _handleDeleteRoomEvent(roomId) {
    if (this._syncList[roomId]) delete this._syncList[roomId];
    this.updateLists();
  }

  _handleRoomLocalEchoUpdatedEvent(event, matrixRoom, oldEventId) {
    const roomId = matrixRoom.roomId;
    if (!this._isChatDisplayed(roomId)) return;

    // If this is an image or file message, we need to remove the associated pending message
    if (
      !oldEventId &&
      event.getType() === 'm.room.message' &&
      (event.getContent().msgtype === 'm.image' || event.getContent().msgtype === 'm.file') &&
      this._chats.all[roomId]
    ) {
      debug('Remove pending image message', roomId, event.getContent());
      const type = event.getContent().msgtype === 'm.image' ? 'image' : 'file';
      this._chats.all[roomId].removePendingMessage(`~~${roomId}:${type}`);
    }

    // If this event updates a message's status
    if (oldEventId && oldEventId === event.getId()) {
      messages.updateMessage(oldEventId, roomId);
    }
    // If this event updates a message's content or relations
    if (!oldEventId && Message.isMessageUpdate(event)) {
      let mainEventId = event.getAssociatedId();
      const relatedEvent = matrixRoom.findEventById(mainEventId);
      // If this is a redaction, it could remove another relation so we need to
      // fetch the main event
      if (Message.isMessageUpdate(relatedEvent)) {
        mainEventId = relatedEvent.getAssociatedId();
      }
      messages.updateMessage(mainEventId, roomId);
    }

    this._chats.all[roomId].update({ timeline: true });
  }

  _handleRoomReceiptEvent(event, matrixRoom) {
    const roomId = matrixRoom.roomId;
    if (!this._isChatDisplayed(roomId)) return;

    Object.keys(event.getContent()).forEach((messageId) => {
      messages.updateMessage(messageId, matrixRoom.roomId);
    });

    if (this._chats.all[roomId] && this._chats.all[roomId].isDirect$.getValue()) {
      if (!this._syncList[roomId]) this._syncList[roomId] = {};
      this._syncList[roomId].receipt = true;
    }
  }

  _handleRoomTimelineEvent(event, matrixRoom) {
    console.log("THE ROOM EVENT IN: HANDLE ROOM TIMELINE", event)
    const roomId = matrixRoom.roomId;
    // todo: we can use these to update snippets for the chat list
    if (!this._isChatDisplayed(roomId)) return;

    if (!this._syncList[roomId]) this._syncList[roomId] = {};
    this._syncList[roomId].timeline = true;

    // If this event updates a message's content or relations
    if (Message.isMessageUpdate(event)) {
      let mainEventId = event.getAssociatedId();
      const relatedEvent = matrixRoom.findEventById(mainEventId);
      if (!relatedEvent) return;
      // If this is a redaction, it could redact another relation so we need to
      // fetch the main event
      if (Message.isMessageUpdate(relatedEvent)) {
        // We need to look for the eventIds in memory because the associated id
        // has been redacted too
        const mainMessage = messages.getMessageByRelationId(relatedEvent.getId(), roomId);
        if (!mainMessage) return;
        mainEventId = mainMessage.id;
      }
      if (!this._syncList[roomId].messages) this._syncList[roomId].messages = {};
      this._syncList[roomId].messages[mainEventId] = true;
    }
  }

  _handleRoomMemberTypingEvent(event, matrixMember) {
    const roomId = matrixMember.roomId;
    if (!this._isChatDisplayed(roomId)) return;

    if (!this._syncList[roomId]) this._syncList[roomId] = {};
    this._syncList[roomId].typing = event.getContent().user_ids;
  }

  _handleRoomStateEvent(event, matrixRoomState) {
    const roomId = matrixRoomState.roomId;
    if (!this._isChatDisplayed(roomId)) return;

    if (!this._syncList[roomId]) this._syncList[roomId] = {};
    this._syncList[roomId].state = true;
  }

  _handleEventDecryptedEvent(event, error) {
    if (!error) {
      const decryptedMessage = messages.getMessageById(event.getId(), event.getRoomId(), event);
      if (decryptedMessage) {
        decryptedMessage.setMatrixEvent(event);
        decryptedMessage.update();
        this.updateLists(true);
      }
    }
  }

  _isChatDisplayed(chat) {
    if (this._opened === 'all') return true;
    if (this._opened === chat) return true;
    return false;
  }

  _listen() {
    matrix.getClient().on('accountData', (event) => this._handleAccountDataEvent(event));
    matrix.getClient().on('deleteRoom', (roomId) => this._handleDeleteRoomEvent(roomId));
    matrix
      .getClient()
      .on('Room.localEchoUpdated', (event, room, oldEventId, oldStatus) =>
        this._handleRoomLocalEchoUpdatedEvent(event, room, oldEventId)
      );
    matrix
      .getClient()
      .on('Room.receipt', (event, room) => this._handleRoomReceiptEvent(event, room));
    matrix
      .getClient()
      .on('Room.timeline', (event, room) => this._handleRoomTimelineEvent(event, room));
    matrix
      .getClient()
      .on('RoomMember.typing', (event, member) => this._handleRoomMemberTypingEvent(event, member));
    matrix
      .getClient()
      .on('RoomState.events', (event, roomState) => this._handleRoomStateEvent(event, roomState));
    matrix
      .getClient()
      .on('Event.decrypted', (event, error) => this._handleEventDecryptedEvent(event, error));

    matrix.getClient().on('sync', (state) => {
      if (['PREPARED', 'SYNCING'].includes(state)) {
        InteractionManager.runAfterInteractions(this._syncChats.bind(this));
      }
    });
  }

  _setOpened(chat) {
    if (this._opened !== chat) {
      if (this._opened && this._opened !== 'all') {
        this._chats.all[this._opened].setTyping(false);
      }

      if (chat === 'all') {
        this.updateLists(true);
      } else if (chat) {
        this._chats.all[chat].update(ChatDetails.ALL);
      }
      this._opened = chat;
    }
  }

  async _syncChats() {
    for (const [roomId, changes] of Object.entries(this._syncList)) {
      if (!this._chats.all[roomId]) {
        this._chats.all[roomId] = new Chat(roomId);
      } else if (this._chats.all[roomId]) {
        this._chats.all[roomId].update(changes);
      }
    }
    if (this._isChatDisplayed('all') && Object.keys(this._syncList).length > 0) {
      await this.updateLists();
    }
    this._syncList = {};
  }

  //* *******************************************************************************
  // Helpers
  //* *******************************************************************************
  async createChat(options) {
    try {
      debug('Creating chat...');
      const response = await matrix.getClient().createRoom(options);
      const matrixRoom = matrix.getClient().getRoom(response.room_id);

      return {
        id: matrixRoom.roomId,
        name: matrixRoom.name,
      };
    } catch (e) {
      console.warn('Error creating chat: ', e);
      return { error: true };
    }
  }

  async createEncryptedChat(usersToInvite) {
    try {
      debug('Creating encrypted chat...');
      const roomId = await matrix.getClient().createEncryptedRoom(usersToInvite);
      const matrixRoom = matrix.getClient().getRoom(roomId);

      return {
        id: matrixRoom.roomId,
        name: matrixRoom.name,
      };
    } catch (e) {
      console.warn('Error creating encrypted chat: ', e);
      return { error: true };
    }
  }

  getAvatarUrl(mxcUrl, size) {
    if (mxcUrl == null) return null;
    try {
      return matrix.getImageUrl(mxcUrl, size, size, 'crop');
    } catch (e) {
      debug('Error in getAvatarUrl:', e);
      return null;
    }
  }

  sortChatsByLastMessage(chatA, chatB) {
    const latestA = messages.getMessageById(chatA.messages$.getValue()[0], chatA.id)?.timestamp;
    const latestB = messages.getMessageById(chatB.messages$.getValue()[0], chatB.id)?.timestamp;
    return latestA && latestB && latestA > latestB ? -1 : latestA < latestB ? 1 : 0;
  }

  isEqualById(a, b) {
    if ((!a || !b) && a !== b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].id !== b[i].id) return false;
    }
    return true;
  }
}

const chatService = new ChatService();
export default chatService;
