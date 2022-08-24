import sdk from 'matrix-js-sdk';

import {
  Message,
  TextMessage,
  FileMessage,
  ImageMessage,
  InfoMessage,
  VideoMessage,
  AudioMessage,
} from '../components/Chat/models/message';
import {MessageType} from '../components/Chat/models/message.type';
import {User, PRESENCE, UserPresense} from '../components/Chat/models/user';
import './poly.js';

import {UserInfoStorage} from 'src/Factory';
import {Alert} from 'react-native';

import Config from 'react-native-config';
import {reject} from 'lodash';
import {API} from '../Api/ApiConfig';
import {Actions} from 'react-native-router-flux';

export default class MatrixService {
  /**@type {sdk.MatrixClient}  */
  client = null;
  host = API.CHAT_URL;
  user = null;
  username = null;
  ready = null;
  accessToken = null;
  userId = null;

  constructor(matrixCredentials) {
    this.client = null;
    this.accessToken = null;
    this.userId = null;
    this.ready = new Promise((resolve, reject) => {
      this.init(matrixCredentials).then(resolve).catch(reject);
    });
  }

  async createClient(username, password, matrixCredentials) {
    const client = sdk.createClient({
      baseUrl: this.host,
      userId: matrixCredentials.matrixUserId,
    });
    this.userId = matrixCredentials.matrixUserId;
    let user = await client.login('m.login.password', {
      user: username,
      password: password,
      userId: matrixCredentials.matrixUserId,
    });
    console.log('User ====', user);

    await client.startClient({initialSyncLimit: 10});

    let clientSyncPromise = new Promise((resolve, reject) => {
      client.once('sync', function (state, prevState, res) {
        console.log('client sync state: ', state, prevState, res);
        if (state === 'PREPARED') {
          resolve();
        } else {
          reject(new Error(`State not prepared, instead: ${state}`));
        }
      });
    });

    await clientSyncPromise;

    this.user = user;
    return client;
  }

  async getClient() {
    if (!this.client) {
      let client = await this.ready;
      this.client = client;
    }
    return this.client;
  }

  async logOut() {
    try {
      const client = await this.getClient();
      await client.logout();
      this.ready = false;
      this.client = null;
      this.accessToken = null;
      this.userId = null;
    } catch (error) {}
  }

  async init(activeCredentials) {
    let useCredentials = activeCredentials;
    let userInfo = await UserInfoStorage.getStoreUserInfo();
    let {matrixCredentials} = userInfo;
    console.log('=====================');
    console.log('In init Services', matrixCredentials);
    console.log('=====================');

    if (matrixCredentials) {
      useCredentials = matrixCredentials;
    }

    try {
      const client = await this.createClient(
        useCredentials.matrixUser,
        useCredentials.matrixPass,
        useCredentials,
      );
      client.publicRooms(function (err, data) {
        // console.log('Public Rooms: %s', JSON.stringify(data));
      });
      this.client = client;
      return client;
    } catch (error) {
      return error;
    }
  }
  async getAllRooms(roomId) {
    try {
      const client = await this.getClient();
      let rooms = await this.getRooms(roomId);
      console.log('The rooms in get all rooms', rooms);
      return rooms;
    } catch (error) {
      console.log('====================================');
      console.log('getAllRooms', error);
      console.log('====================================');
    }
  }

  async getRooms(roomId) {
    console.log('The room Id in getRooms', roomId);
    const client = await this.getClient();
    console.log('The client in getRoom :', client);
    let rooms = client.getRooms();
    let getRoom = await client.getRoom(roomId);
    console.log('rooms in get rooms/n:', rooms);
    console.log('getRoom/n:', getRoom);
    return rooms;
  }

  async getRoomById(roomId) {
    let rooms = await this.getAllRooms(roomId);
    // console.log('====================================');
    // console.log('getRoomById-getAllRooms', rooms, roomId);
    // console.log('====================================');
    let results = rooms.filter(room => room.roomId == roomId);
    if (results.length === 0) {
      throw new Error(`No room with id '${roomId}' found`);
    }
    let room = results[0];
    return room;
  }

  async getCurrentUserId() {
    // const client = await this.getClient();
    if (this.userId) {
      return this.userId;
    }
    // let userId = await new sdk.User().userId;
    // console.log('userId', userId);
    // return userId;
  }

  async getUserProfile(userId) {
    const client = await this.getClient();
    // const chat = await client.getRoomMessagesFromRoomID();
    let profile = await client.getProfileInfo(userId);
    profile = {...profile, userId};

    let user = new User();
    user.id = profile.userId;
    user.name = profile.displayname;
    user.avatar = profile.avatar_url;

    if (user.avatar) {
      user.avatar = client.mxcUrlToHttp(user.avatar);
    }
    return user;
  }

  async getCurrentUser() {
    let userId = await this.getCurrentUserId();
    let profile = await this.getUserProfile(userId);

    return profile;
  }

  async getRoomMembers(roomId) {
    const room = await this.getRoomById(roomId);

    let members = room.getJoinedMembers();
    let profilesP = members.map(m => this.getUserProfile(m.userId));
    let profiles = await Promise.all(profilesP);
    return profiles;
  }

  async extractTextMessagesTimeline1(tl) {
    // console.log('TImeLine', tl);
    let messages = tl.filter(e => e.type === 'm.room.message');
    // console.log('-----> extractTextMessagesTimeline1', messages);
    let messageTextsP = messages.map(
      async e => await this.extractMessageFromEvent1(e),
    );
    console.log('MESSAGES IN TIMELINE', messages);

    let messageTexts = await Promise.all(messageTextsP);
    // console.log('-----> extractTextMessagesTimeline1', messageTextsP);
    return messageTexts;
  }

  async getRoomMessagesFromRoomID(roomId, limit = 30) {
    const client = await this.getClient();

    let c = await client.roomInitialSync(roomId, 100);

    const room = await this.getRoomById(roomId);

    console.log('The ROOM : SDK METHOD', room);

    const accountData = room.accountData;

    const fullyReadEventId =
      room?.accountData['m.fully_read']?.event.content.event_id;

    let timeline = room.getLiveTimeline();

    let eventsFromTimeline = timeline.getEvents();

    let messageEvents = eventsFromTimeline.filter(
      e => e.getType() === 'm.room.message',
    );

    let messageEventsFromOther = messageEvents.filter(
      e => e.sender.userId !== this.userId,
    );

    let lastReadMessage =
      messageEventsFromOther[messageEventsFromOther.length - 1];

    if (lastReadMessage) {
      let setRoomReadMarker = await client.setRoomReadMarkers(
        roomId,
        lastReadMessage.event.event_id,
        lastReadMessage,
      );
    }

    // console.log(' Send Read Recipt FROM SDK TIMELINE', setRoomReadMarker);

    // let result = await client.scrollback(a, limit);
    // console.log('--------> newRoomresult', c, c.messages);
    // console.log(timeline);
    let messages = await this.extractTextMessagesTimeline1(c.messages.chunk, c);

    // let updateReadPropertyMessages =
    // console.log('-----> getRoomMessagesFromRoomID', messages);
    let stoppingIndex = 0;
    let messageEventsFromUser = messages.filter((e, index) => {
      if (e.id == fullyReadEventId) {
        console.log('Index to Stop:', index);
        stoppingIndex = index;
        // e.read = true;
        // return e;
      }

      if (e.from.id == this.userId) {
        if (stoppingIndex > 0) {
          // e.read = true;
          return e;
        }
        e.read = true;
      }
    });



    return messages;
  }

  async sendTextMessageToRoom(roomId, message) {
    const client = await this.getClient();
    var content = {
      body: message,
      msgtype: 'm.text',
    };

    let promise = new Promise((resolve, reject) => {
      client
        .sendEvent(roomId, 'm.room.message', content, '')
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });

    return promise;
  }

  async sendImageMessageToRoom(roomId, message) {
    const client = await this.getClient();
    var content = {
      body: message.message,
      info: {
        h: message.height,
        mimetype: message.mimetype,
        size: message.size,
        w: message.width,
      },
      msgtype: 'm.image',
      url: message.url,
    };
    // console.log('The Content Object', content);
    let promise = new Promise((resolve, reject) => {
      client
        .sendEvent(roomId, 'm.room.message', content, '')
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });

    return promise;
  }

  toMessageType(matrixMessageType) {
    let messageType = null;
    switch (matrixMessageType) {
      case 'm.text':
        messageType = MessageType.TEXT;
        break;
      case 'm.notice':
        messageType = MessageType.INFO;
        break;

      case 'm.image':
        messageType = MessageType.IMAGE;
        break;
      case 'm.file':
        messageType = MessageType.FILE;
        break;
      case 'm.audio':
        messageType = MessageType.AUDIO;
        break;
      case 'm.video':
        messageType = MessageType.VIDEO;
        break;
      default:
        messageType = MessageType.NOTFOUND;
    }

    return messageType;
  }

  async extractMessageContents(content, messageType) {
    let client = await this.getClient();
    // console.log('The Contents in Matrix Service', content);
    /**@type {Message} */
    let message = null;
    switch (messageType) {
      case MessageType.TEXT:
        let tm = new TextMessage();
        tm.messageType = MessageType.TEXT;
        message = tm;
        break;
      case MessageType.INFO:
        let im = new InfoMessage();
        message = im;
        break;

      case MessageType.IMAGE:
        let imageMessage = new ImageMessage();
        imageMessage.filename = content.body;
        imageMessage.height =
          content && content.info && content.info.h ? content.info.h : 100;
        imageMessage.width =
          content && content.info && content.info.w ? content.info.w : 100;
        imageMessage.mimetype = content.info.mimetype;
        imageMessage.size = content.info.size;
        imageMessage.url = content.url;
        imageMessage.url = client.mxcUrlToHttp(imageMessage.url);

        message = imageMessage;
        break;

      case MessageType.AUDIO:
        let am = new AudioMessage();
        am.filename = content.body;
        am.mimetype = content.info.mimetype;
        am.size = content.info.size;
        am.url = content.url;
        am.url = client.mxcUrlToHttp(am.url);
        message = am;
        break;

      case MessageType.VIDEO:
        let vm = new VideoMessage();
        vm.filename = content.body;
        vm.mimetype = content.info.mimetype;
        vm.size = content.info.size;
        vm.url = content.url;
        vm.url = client.mxcUrlToHttp(vm.url);
        vm.duration = content.info.duration;
        vm.height = content.info.h;
        vm.width = content.info.w;
        vm.thumbnailHeight = content.info.thumbnail_info.h;
        vm.thumbnailWidth = content.info.thumbnail_info.w;
        vm.thumbnailMimetype = content.info.thumbnail_info.mimetype;
        vm.thumbnailSize = content.info.thumbnail_info.size;
        vm.thumbnailUrl = content.info.thumbnail_url;
        vm.thumbnailUrl = client.mxcUrlToHttp(vm.thumbnailUrl);

        message = vm;
        break;

      case MessageType.FILE:
        let fm = new FileMessage();
        fm.filename = content.filename;
        fm.mimetype = content.info.mimetype;
        fm.size = content.info.size;
        fm.url = content.url;
        fm.thumbnailUrl = client.mxcUrlToHttp(fm.thumbnailUrl);
        message = fm;
        break;

      default:
        message = new Message();
    }

    return message;
  }

  async extractMessageFromEvent1(e) {
    if (e.type !== 'm.room.message') {
      return null;
    }

    let content = e.content;
    let messageType = this.toMessageType(content.msgtype);

    let userId = e.sender;
    let user = await this.getUserProfile(userId);

    let message = await this.extractMessageContents(content, messageType);
    message.message = content.body;
    message.content = content;
    message.datetime = e.origin_server_ts;
    message.room = e.room_id;
    message.id = e.event_id;
    message.from = user;

    message.read = false;
    // console.log('-----> extractMessageFromEvent1', message);

    return message;
  }

  async extractMessageFromEvent(e) {
    if (e.getType() !== 'm.room.message') {
      return null;
    }

    let content = e.getContent();
    let messageType = this.toMessageType(content.msgtype);

    let userId = e.getSender();
    let user = await this.getUserProfile(userId);

    let message = await this.extractMessageContents(content, messageType);
    message.message = content.body;
    message.datetime = e.getDate();
    message.room = e.getRoomId();
    message.id = e.getId();
    message.from = user;

    return message;
  }

  async onMessageReceive(roomId, callback) {
    if (!callback) {
      throw new Error(`No callback provided`);
    }
    const client = await this.getClient();

    client.on('Room.receipt', async function (event, room) {
      console.log('THE ROOM ID', room.roomId);
      console.log('EVENT THAT HAS BEEN READ', event, room);
      if (Actions.currentScene !== 'Chat') {
        return;
      }
      if (room.roomId === roomId) {
        // console.log('EVENT THAT HAS BEEN READ', event, room);
        // event
        var receiptContent = event.getContent();
        var eventKeys = Object.keys(receiptContent);
        var eventId = eventKeys[0];
        console.log('Hello', receiptContent, eventId, eventKeys);
        var matrixMessageEvent = room.timeline.filter(
          me => me.event.event_id == eventId,
        );
        let senderObj = null;
        let senderKey = null;
        if (receiptContent) {
          senderObj = receiptContent[eventId]['m.read'];
          senderKey = Object.keys(senderObj)[0];
          console.log('THE SENDER OBJ,KEY', senderObj, senderKey);
          let eventAlterRes = {
            sender: {
              userId: senderKey,
            },
          };

          console.log(
            'THE MATRIX MESSAGE EVENT READ WALA',
            matrixMessageEvent[0],
          );
          if (senderKey !== room.myUserId) {
            // Alert.alert('HIya');
            let setRoomReadMarker = await client.setRoomReadMarkers(
              roomId,
              eventId,
              matrixMessageEvent[0],
            );
            // await client.sendReadReceipt(matrixMessageEvent[0]);
            console.log('Room Read Marker FROM ON RECIEVE', setRoomReadMarker);
          }
          // let setRoomReadMarker = await client.setRoomReadMarkers(
          //   roomId,
          //   eventId,
          //   matrixMessageEvent[0],
          // );
          // console.log('Room Read Marker FROM ON RECIEVE', setRoomReadMarker);
          callback(null, eventAlterRes, room.myUserId);
        }
      }
    });

    client.on('Room.timeline', async (event, room, toStartOfTimeline) => {
      if (event.getType() !== 'm.room.message') {
        return;
      }

      console.log('=======> onMessageReceive', event);

      // we are only intested in messages from the test room, which start with "!"
      if (event.getRoomId() === roomId) {
        if (event.sender.userId == !this.userId) {
          let setRoomReadMarker = await client.setRoomReadMarkers(
            roomId,
            event.event_id,
            event,
          );
          console.log('Room Read Marker FROM ON RECIEVE', setRoomReadMarker);
        }
        this.extractMessageFromEvent(event)
          .then(message => {
            callback(message, event, this.userId);
          })
          .catch(console.log);
      }
    });
  }

  async onGlobalMessageRecieve(callback) {
    if (!callback) {
      throw new Error(`No callback provided`);
    }
    const client = await this.getClient();
    client.on('Room.timeline', async (event, room, toStartOfTimeline) => {
      if (event.getType() !== 'm.room.message') {
        return;
      }

      console.log('=======> onMessageReceive', event);

      // we are only intested in messages from the test room, which start with "!"
      this.extractMessageFromEvent(event)
        .then(message => {
          callback(message, event, this.userId);
        })
        .catch(console.log);
    });
  }

  _extractPresenseFromContent(userId, content) {
    let presence = new UserPresense();
    switch (content.presence) {
      case 'online':
        presence.status = PRESENCE.ONLINE;
        break;
      case 'offline':
        presence.status = PRESENCE.OFFLINE;
        break;
      case 'unavailable':
        presence.status = PRESENCE.UNAVAILABLE;
        break;
      default:
        presence.status = null;
    }

    presence.lastActive = content.last_active_ago; // milliseconds
    presence.userId = userId;

    return presence;
  }

  _extractPresenceFromEvent(event) {
    if (event.getType() !== 'm.presence') {
      return;
    }
    let userId = event.getSender();
    let content = event.getContent();

    let presence = this._extractPresenseFromContent(userId, content);

    let date = event.getDate();
    let eventId = event.getId();

    presence.datetime = date;
    presence.eventId = eventId;

    return presence;
  }

  async onPresense(userId, callback) {
    if (!callback) {
      throw new Error(`No callback provided`);
    }
    const client = await this.getClient();

    let presenceR = await client.getPresence(userId);
    let presence = this._extractPresenseFromContent(userId, presenceR);
    callback(presence);
    client.on('event', event => {
      if (event.getType() !== 'm.presence') {
        return;
      }

      if (event.getSender() !== userId) {
        return;
      }

      let presence = this._extractPresenceFromEvent(event);
      if (presence) {
        callback(presence);
      }
    });
  }
  async uploadContent(file, options) {
    const client = await this.getClient();
    const uploadResponse = await client.uploadContent(file, options);
    console.log('The Uplaod Response in service', uploadResponse);
    return uploadResponse;
  }

  async onReadLatestEvent(event) {
    let client = await this.getClient();
    if (!client) {
      return;
    }
    client.sendReadReceipt(event);
  }

  async getUnreadNotificationCount(roomId) {
    // let client = this.getClient();
    const room = await this.getRoomById(roomId);
    console.log('Room In Get Notification Count', room);
    let count = room.getUnreadNotificationCount();
    console.log('THE COUNT IN ROOM', count);
    // this.getLastRoomMessage(roomId);
    return count;
  }

  async getLastRoomMessage(roomId) {
    const client = await this.getClient();
    let c = await client.roomInitialSync(roomId, 3);
    let messages = await this.extractTextMessagesTimeline1(c.messages.chunk, c);

    // const messages = await roo
    console.log('Room In Get Last Message ', messages);
    if (messages.length == 0) {
      return null;
    }
    const lastMessage = messages[messages.length - 1];
    console.log('THE LAST MESSAGE', lastMessage);
    let lastMessageString = lastMessage.message;
    return lastMessageString;
  }
}
