import sdk from 'matrix-js-sdk';

import {
  Message,
  TextMessage,
  FileMessage,
  ImageMessage,
  InfoMessage,
  VideoMessage,
  AudioMessage,
} from '../Components/Chat/models/message';
import {MessageType} from '../Components/Chat/models/message.type';
import {User, PRESENCE, UserPresense} from '../Components/Chat/models/user';
import './poly.js';

import Config from 'react-native-config';
import {reject} from 'lodash';
import {API} from '../Api/ApiConfig';

import {MemoryStore, MatrixEvent} from 'matrix-js-sdk';

import AsyncStorage from '@react-native-community/async-storage';
import AsyncCryptoStore from './storage/AsyncCryptoStore';

import {Alert} from 'react-native';
import {async} from 'rxjs';
import {getUserMatrixData} from '../Utils/Storage';
import {OlmDevice} from 'matrix-js-sdk/lib/crypto/OlmDevice';

// import localStorage

global.Olm = require('@matrix-org/olm/olm_legacy');

// if (!Promise.allSettled) {
//   Promise.allSettled = promises =>
//     Promise.all(
//       promises.map((promise, i) =>
//         promise
//           .then(value => ({status: 'fulfilled', value}))
//           .catch(reason => ({status: 'rejected', reason})),
//       ),
//     );
// }

// sdk.

const MATRIX_CLIENT_START_OPTIONS = {
  initialSyncLimit: 10,
  lazyLoadMembers: true,
  pendingEventOrdering: 'detached',
  timelineSupport: true,
  unstableClientRelationAggregation: true,
  // sessionStore: new sdk.MemoryStore(AsyncStorage),
  // sessionStorage: new sdk.WebStorageSessionStore(window.sessionStorage),
  // cryptoStore: new sdk.MemoryCryptoStore(),
  // store: new MemoryStore({
  //   localStorage: AsyncStorage,
  // }),
  // cryptoStore: new AsyncCryptoStore(AsyncStorage),
  // sessionStore: {
  //   getLocalTrustedBackupPubKey: () => null,
  // }, // js-sdk complains if this isn't supplied but it's only used for remembering a local trusted backup key
};

export default class MatrixService {
  /**@type {sdk.MatrixClient}  */
  client = null;
  // host = Config.CHAT_SERVER_URL;
  host = 'http://192.168.18.22:8008';
  user = null;
  username = null;
  ready = null;
  accessToken = null;
  userId = null;
  deviceId = null;

  constructor(matrixCredentials) {
    this.client = null;
    this.accessToken = null;
    this.userId = null;
    this.ready = new Promise((resolve, reject) => {
      this.init(matrixCredentials).then(resolve).catch(reject);
    });
  }

  async createClient(matrixCredentials) {
    const client = sdk.createClient({
      baseUrl: this.host,
      accessToken: matrixCredentials.accessToken,
      userId: matrixCredentials.userId,
      deviceId: matrixCredentials.deviceId,
      ...MATRIX_CLIENT_START_OPTIONS,
    });
    this.deviceId = matrixCredentials.deviceId;
    this.userId = matrixCredentials.userId;
    this.accessToken = matrixCredentials.accessToken;

    // const user = await client.login('m.login.password', {
    //   user: 'lucian',
    //   password: 'Lucian!@#$%',
    //   userId: matrixCredentials.userId,
    // });

    // console.log('THE USER BY LOGIN', user);

    // this.user = {
    //   baseUrl: this.host,
    //   accessToken: matrixCredentials.accessToken,
    //   userId: matrixCredentials.userId,
    //   deviceId: matrixCredentials.deviceId,
    // };
    // let user = await client.login('m.login.password', {
    //   user: username,
    //   password: password,
    //   userId: matrixCredentials.matrixUserId,
    // });
    console.log('client ====', client);

    let clientSyncPromise = null;

    await client.initCrypto();
    // .then(async () => {
    //   client.setGlobalErrorOnUnknownDevices(false);
    await client.startClient({initialSyncLimit: 10});
    // });

    client.setGlobalErrorOnUnknownDevices(false);

    // await client.startClient({initialSyncLimit: 10});

    // await client.startClient({initialSyncLimit: 10});
    clientSyncPromise = new Promise((resolve, reject) => {
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

    // this.verifyDevice(matrixCredentials.userId, matrixCredentials.deviceId);

    client.on('RoomMember.membership', function (event, member) {
      if (
        member.membership === 'invite' &&
        member.userId === matrixCredentials.userId
      ) {
        client.joinRoom(member.roomId).then(function () {
          console.log('Auto-joined %s', member.roomId);
        });
      }
    });

    // this.user = user;
    // this.client = client;

    console.log('THE THIS. CLIENT', this.client);
    return client;
  }

  async getClient() {
    // console.log('THE CLIENT IN GET CLIENT', this.client);
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
    // Alert.alert('HI');
    let useCredentials = activeCredentials;
    let matrixDataFromStorage = await getUserMatrixData();

    console.log('=====================');
    console.log('In init Services', matrixDataFromStorage);
    console.log('=====================');

    if (matrixDataFromStorage) {
      useCredentials = matrixDataFromStorage;
    }

    if (!useCredentials) {
      let client = sdk.createClient({baseUrl: this.host});
      this.client = client;
      return Alert.alert('No Data');
    }

    try {
      const client = await this.createClient(useCredentials);
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
      console.log('THE CLIETNS', client, roomId);
      if (!roomId) {
        const allRooms = client.getRooms();
        console.log('THE ROOMS IN SERVICE', allRooms);
        if (allRooms.length) {
          return allRooms;
        }
        return [];
      }

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

  //   async extractTextMessagesTimeline1(tl) {
  //     // console.log('TImeLine', tl);
  //     let messages = tl.filter(e => e.type === 'm.room.message');
  //     // console.log('-----> extractTextMessagesTimeline1', messages);
  //     let messageTextsP = messages.map(
  //       async e => await this.extractMessageFromEvent1(e),
  //     );
  //     console.log('MESSAGES IN TIMELINE', messages);

  //     let messageTexts = await Promise.all(messageTextsP);
  //     // console.log('-----> extractTextMessagesTimeline1', messageTextsP);
  //     return messageTexts;
  //   }

  async extractTextMessagesTimeline1(tl, allEvents) {
    const client = await this.getClient();
    console.log('====================================');
    console.log('extractTextMessagesTimeline', tl, allEvents);
    console.log('====================================');

    let messages = tl.filter(e => e.type === 'm.room.message');
    // let encryptedMessages = tl.filter(e => e.type === 'm.room.encrypted');
    let encryptedMessages = allEvents;

    let messageTextsE = encryptedMessages.map(async e => {
      // client.crypto
      let decryptedEvent = await client.crypto.decryptEvent(e);
      console.log('THE EVENT:EVENT:EVENT', decryptedEvent);
      if (!decryptedEvent) {
        Alert.alert('Errorr');
      }
      return {
        decryptedEvent: await Promise.resolve(decryptedEvent),
        event: e.event,
        matrixEvent: e,
      };
    });

    console.log(
      '================= In Room Encrpted Text Start: From TimeLines ==============',
    );
    // const eventExtraction = await client.decryptEventIfNeeded(
    //   encryptedMessages[0],
    // );
    console.log(
      'The Event Extraction: In TimeLines: All Encrypted Messages -> Unencrypted',
      messageTextsE,
    );
    console.log(
      '================= In Room Encrpted End : From TimeLines ==============',
    );

    let encryptedMessagesForExtraction = await Promise.all(allEvents);
    console.log(
      '-----> extractTextMessagesTimeline1:encryptedMessagesForExtraction',
      encryptedMessagesForExtraction,
    );

    // ({ body } = event.clearEvent.content);
    // } catch (error) {
    //   console.error('#### ', error);
    // }
    // return
    let allDecryptedMessages = encryptedMessagesForExtraction.map(async e =>
      this.extractMessageFromEncryptedEvent(e.event, e.decryptedEvent),
    );

    console.log('========================================');
    console.log('-----> All Descrypted Events', allDecryptedMessages);
    console.log('========================================');

    let decryptedMessageTexts = await Promise.all(allDecryptedMessages);

    // this.extractMessageFromEncryptedEvent(event.event, eventExtraction)
    //   .then(message => {
    //     callback(message);
    //   })
    //   .catch(console.log);

    let messageTextsP = messages.map(
      async e => await this.extractMessageFromEvent1(e),
    );
    let messageTexts = await Promise.all(messageTextsP);

    let allMessages = messageTexts.concat(decryptedMessageTexts);
    // console.log('-----> extractTextMessagesTimeline1', messageTextsP);
    return allMessages;
  }

  async getRoomMessagesFromRoomID(roomId, limit = 30) {
    const client = await this.getClient();

    let c = await client.roomInitialSync(roomId, 100);

    const room = await this.getRoomById(roomId);

    client.setRoomEncryption(roomId, {algorithm: 'm.megolm.v1.aes-sha2'});

    // FOR END TO END START =================
    // console.log('All The Events', room);
    // const filterEncryptedEvents = room.timeline.filter(
    //   t => t.event.type === 'm.room.encrypted',
    // );

    // FOR END TO END CLOSE =================

    // console.log('The ROOM : SDK METHOD', room);

    const accountData = room.accountData;

    const fullyReadEventId =
      room?.accountData['m.fully_read']?.event.content.event_id;

    let timeline = room.getLiveTimeline();

    console.log('THE LIVE TIMELINE', client.room);

    // /

    let eventsFromTimeline = timeline.getEvents();

    // console.log('THE EVENTS FROM TIMELINE', eventsFromTimeline);

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

    // const roomEvents = room.getT

    let messages = await this.extractEventsInitialFromSync(c.messages.chunk);
    // let messages = await this.extractTextMessagesTimeline1(
    //   c.messages.chunk,
    //   filterEncryptedEvents,
    // );

    // let updateReadPropertyMessages =
    // console.log('-----> getRoomMessagesFromRoomID', messages);
    let stoppingIndex = 0;
    let messageEventsFromUser = messages.filter((e, index) => {
      // console.log('THE E ID ISSUE', e);
      if (e?.id == fullyReadEventId) {
        console.log('Index to Stop:', index);
        stoppingIndex = index;
        // e.read = true;
        // return e;
      }

      if (e?.from?.id == this.userId) {
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

  async extractEncryptedMessageContents(content, messageType, completeEvent) {
    let client = await this.getClient();
    console.log('The Client', client);
    if (!client) {
      return null;
    }
    // console.log('The Contents in Matrix Service', completeEvent);
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

  async extractMessageFromEncryptedEvent(event, decryptedEvent) {
    console.log('The event in extract from Encrpted ', event);
    console.log('==========================');
    console.log('The decrypted event ', decryptedEvent);

    const client = await this.getClient();

    if (event.type !== 'm.room.encrypted') {
      // Alert.alert('Come here');
      return null;
    }
    // this.autoVerify(event.room_id);
    let content = decryptedEvent?.clearEvent?.content;
    console.log('The Content Object', content);
    let messageType = this.toMessageType(content.msgtype);
    console.log('The Message Type', messageType);
    let userId = event.sender;
    let user = await this.getUserProfile(userId);

    let message = await this.extractEncryptedMessageContents(
      content,
      messageType,
      event,
    );
    message.message = content.body;
    message.content = content;
    message.datetime = event.origin_server_ts;
    message.room = event.room_id;
    message.id = event.event_id;
    message.from = user;

    console.log('-----> extractMessageFromEvent1', message);

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

  async forwardDeviceKeys(event) {
    const client = await this.getClient();
    if (!this.userId || !this.deviceId) {
      conosle.log(
        'sendToDeviceForwardKeys: error -> userId || deviceId is undefined',
      );
      return;
    }
    const res = await client.sendToDevice('m.forwarded_room_key', {
      user: this.userId,
      deviceId: this.deviceId,
      content: {
        ...event.body,
        forwarding_curve25519_key_chain: event.forwarding_curve25519_key_chain,
        sender_claimed_ed25519_key: event.senderCurve25519Key,
      },
    });
    console.log('the res by forwarding keys', res);
  }

  async onMessageReceive(roomId, callback) {
    // Alert.alert('Listener Actvated');
    if (!callback) {
      throw new Error(`No callback provided`);
    }
    const client = await this.getClient();
    const forwardDeviceKeys = this.forwardDeviceKeys;
    const userId = this.userId;
    const deviceId = this.deviceId;

    // console.log('CLIENT: onMessageRecieve', client, roomId);

    // client.on('event', async function (event, room) {
    //   console.log('ANY EVENT', event);
    // });
    // this.fo

    client.on('toDeviceEvent', async function (event, room) {
      Alert.alert('TO Device Event');
      console.log('TO DEVICE EVENT', event);
      // if (event.getType() === 'm.key.verification.request') {
      //   console.log('THE EVENT: VERIFICATION', event);
      //   // const responseVerificationReady = client.sendToDevice(
      //   //   'm.key.verification.ready',
      //   //   {
      //   //     // from_device:
      //   //     // user: userId,
      //   //     // deviceId: deviceId,
      //   //     // content: {
      //   //     //   ...event.body,
      //   //     //   forwarding_curve25519_key_chain:
      //   //     //     event.forwarding_curve25519_key_chain,
      //   //     //   sender_claimed_ed25519_key: event.senderCurve25519Key,
      //   //     },
      //   //   },
      //   // );
      //   // console.log('ResponesFromVerificationReady', responseVerificationReady);
      // }
      // if (event.getType() === 'm.room_key_request') {
      //   Alert.alert('Requesting Room KEY');
      //   console.log('KEY_REQUEST_EVENT', event);
      //   // console.
      //   console.log('THE DECRPTED EVENT', client.crypto.decryptEvent(event));
      //   const responseForwardKey = await client.sendToDevice(
      //     'm.forwarded_room_key',
      //     {
      //       algorithm: event.event.content.body.algorithm,
      //       forwarding_curve25519_key_chain: event.forwardingCurve25519KeyChain,
      //       room_id: event.event.content.body.room_id,
      //       // sender_claimed_ed25519_key:
      //       sender_key: event.event.content.body.sender_key,
      //       session_id: event.event.content.body.session_id,

      //       // user: userId,
      //       // deviceId: deviceId,
      //       // content: {
      //       //   ...event.body,
      //       //   forwarding_curve25519_key_chain:
      //       //     event.forwarding_curve25519_key_chain,
      //       //   sender_claimed_ed25519_key: event.senderCurve25519Key,
      //       // },
      //     },
      //   );
      //   // const responseForwardKey = forwardDeviceKeys(event);
      //   // // this.fo;
      //   // // let responseForwardKey = await this.forwardDeviceKeys(event);
      //   console.log('responseForwardKey, ', responseForwardKey);
      //   // client.emit('m.forwarded_room_key', async function (response) {
      //   //   sendToDeviceForwardKeys();
      //   //   console.log("Hi, I'm Ready: m.key_key_request", response);
      //   // });
      // }
      // this;
    });

    // this.forwardDeviceKeys()

    // client.on('Room.receipt', async function (event, room) {
    //   console.log('THE ROOM ID', room.roomId);
    //   console.log('EVENT THAT HAS BEEN READ', event, room);
    //   if (room.roomId === roomId) {
    //     // console.log('EVENT THAT HAS BEEN READ', event, room);
    //     // event
    //     var receiptContent = event.getContent();
    //     var eventKeys = Object.keys(receiptContent);
    //     var eventId = eventKeys[0];
    //     console.log('Hello', receiptContent, eventId, eventKeys);
    //     var matrixMessageEvent = room.timeline.filter(
    //       me => me.event.event_id == eventId,
    //     );
    //     let senderObj = null;
    //     let senderKey = null;
    //     if (receiptContent) {
    //       senderObj = receiptContent[eventId]['m.read'];
    //       senderKey = Object.keys(senderObj)[0];
    //       console.log('THE SENDER OBJ,KEY', senderObj, senderKey);
    //       let eventAlterRes = {
    //         sender: {
    //           userId: senderKey,
    //         },
    //       };

    //       console.log(
    //         'THE MATRIX MESSAGE EVENT READ WALA',
    //         matrixMessageEvent[0],
    //       );
    //       if (senderKey !== room.myUserId) {
    //         // Alert.alert('HIya');
    //         let setRoomReadMarker = await client.setRoomReadMarkers(
    //           roomId,
    //           eventId,
    //           matrixMessageEvent[0],
    //         );
    //         // await client.sendReadReceipt(matrixMessageEvent[0]);
    //         console.log('Room Read Marker FROM ON RECIEVE', setRoomReadMarker);
    //       }
    //       // let setRoomReadMarker = await client.setRoomReadMarkers(
    //       //   roomId,
    //       //   eventId,
    //       //   matrixMessageEvent[0],
    //       // );
    //       // console.log('Room Read Marker FROM ON RECIEVE', setRoomReadMarker);
    //       callback(null, eventAlterRes, room.myUserId);
    //     }
    //   }
    // });

    // client.on('RoomState.newMember', async (event, room, toStartOfTimeline) => {
    //   console.log('Hello ROOM STATE EVENT NEW MEMBER', event);
    // });

    client.on('Room.timeline', async (event, room, toStartOfTimeline) => {
      // Alert.alert('Listener Actvated');
      // console.log('EVENT', event);
      // Alert.alert('Hi');

      // if (event.event.type === 'm.room.encrypted') {
      //   // Alert.alert('HI');
      //   // const event = client.crypto.decryptEvent(event);
      //   // this.autoVerify(event.event.room_id);
      //   // try {
      //   // let alteredEvent = event;
      //   // alteredEvent.
      //   console.log(
      //     '================= In Room Encrpted Text Start ==============',
      //   );

      //   // const ifNeededDecryption = await client.decryptEventIfNeeded(event);
      //   // console.log('IF NEEDED DECRYPTION', ifNeededDecryption);

      //   const eventHandled = await this.handleEvent(event.event);
      //   const extractedMessage = await this.extractMessageFromMatrixEvent(
      //     eventHandled,
      //   );

      //   // const extractMessageEvent = await this.extractMessageFromMatrixEvent(
      //   //   eventHandled,
      //   // );
      //   // await client.crypto.decryptEvent(event);
      //   console.log('The Event Extraction', eventHandled, extractedMessage);
      //   console.log('================= In Room Encrpted End ==============');
      //   // ({ body } = event.clearEvent.content);
      //   // } catch (error) {
      //   //   console.error('#### ', error);
      //   // }
      //   this.extractMessageFromMatrixEvent(eventHandled)
      //     .then(message => {
      //       // console.log('THE MESSAGE IN CALLBACK', message);
      //       callback(message, event, this.userId);
      //     })
      //     .catch(console.log);
      // }

      console.log('=======> ', event);

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

  // async onGlobalMessageRecieve(callback) {
  //   if (!callback) {
  //     throw new Error(`No callback provided`);
  //   }
  //   const client = await this.getClient();
  //   client.on('Room.timeline', async (event, room, toStartOfTimeline) => {
  //     if (event.getType() !== 'm.room.message') {
  //       return;
  //     }

  //     console.log('=======> onMessageReceive', event);

  //     // we are only intested in messages from the test room, which start with "!"
  //     this.extractMessageFromEvent(event)
  //       .then(message => {
  //         callback(message, event, this.userId);
  //       })
  //       .catch(console.log);
  //   });
  // }

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

  // async forwardDeviceKeys(event) {
  //   const client = await this.getClient();
  //   if (!this.userId || !this.deviceId) {
  //     conosle.log(
  //       'sendToDeviceForwardKeys: error -> userId || deviceId is undefined',
  //     );
  //     return;
  //   }
  //   const res = await client.sendToDevice('m.forwarded_room_key', {
  //     user: this.userId,
  //     deviceId: this.deviceId,
  //     content: {
  //       ...event.body,
  //       forwarding_curve25519_key_chain: event.forwarding_curve25519_key_chain,
  //       sender_claimed_ed25519_key: event.senderCurve25519Key,
  //     },
  //   });
  //   console.log('the res by forwarding keys', res);
  // }

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

  async autoVerify(room_id) {
    // Alert.alert('Called Auto Verify');
    let client = await this.getClient();
    let room = client.getRoom(room_id);
    const e2eMembers = await room.getEncryptionTargetMembers();
    for (const member of e2eMembers) {
      const devices = client.getStoredDevicesForUser(member.userId);
      for (const device of devices) {
        if (device.isUnverified()) {
          await this.verifyDevice(member.userId, device.deviceId);
        }
      }
    }
  }

  async verifyDevice(userId, deviceId) {
    let client = await this.getClient();
    if (!userId || typeof userId !== 'string') {
      throw new Error('"userId" is required and must be a string.');
    }
    if (!deviceId || typeof deviceId !== 'string') {
      throw new Error('"deviceId" is required and must be a string.');
    }
    // Alert.alert('Verifiying Device');
    await client.setDeviceKnown(userId, deviceId, true);
    await client.setDeviceVerified(userId, deviceId, true);
    // await client.ver
  }

  async loginWithPassword(username, password, homeserver, initCrypto = true) {
    try {
      let user = username;
      console.log('Logging in as %s on %s', user, this.host);
      let client = sdk.createClient({baseUrl: this.host});
      console.log('Logging in to created client...', client);
      // let user = await client.login('m.login.password', {
      //   user: username,
      //   password: password,
      //   userId: matrixCredentials.matrixUserId,
      // });
      const response = await client.login('m.login.password', {
        user: username,
        password: password,
        // refresh_token: true,
      });
      console.log(
        'Logging in again with device ID... ',
        JSON.stringify(response),
      );

      // this.init()
      // client = await sdk.createClient(
      //   this.host,
      //   response.access_token,
      //   response.user_id,
      //   response.device_id,
      // );

      this.client = client;
      this.user = response;
      this.userId = response.user_id;

      const data = {
        userId: response.user_id,
        accessToken: response.access_token,
        homeserver: this.host,
        deviceId: response.device_id,
        crypto: true,
        ...response,
      };

      this.init(data);

      // await this._setData(data);

      return data;
    } catch (e) {
      console.log('Error logging in:', e);
      const data = {};
      if (e.errcode) {
        // Matrix errors
        data.error = e.errcode;
        switch (e.errcode) {
          case 'M_FORBIDDEN':
            data.message = 'auth:login.forbiddenError';
            break;
          case 'M_USER_DEACTIVATED':
            data.message = 'auth:login.userDeactivatedError';
            break;
          case 'M_LIMIT_EXCEEDED':
            data.message = 'auth:login.limitExceededError';
            break;
          default:
            data.message = 'auth:login.unknownError';
        }
      } else {
        // Connection error
        // TODO: test internet connection
        data.error = 'NO_RESPONSE';
        data.message = 'auth:login.noResponseError';
      }
      return data;
    }
  }

  // NEW METHODS =====================>

  async extractMessageFromMatrixEvent(event) {
    // if (
    //   event.getType() !== 'm.room.message' ||
    //   event.getType() !== 'm.room.encrypted'
    // ) {
    //   return null;
    // }

    let content = event.getContent();
    let messageType = this.toMessageType(content.msgtype);

    let userId = event.getSender();
    let user = await this.getUserProfile(userId);

    let message = await this.extractMessageContents(content, messageType);
    message.message = content.body;
    message.datetime = event.getDate();
    message.room = event.getRoomId();
    message.id = event.getId();
    message.from = user;

    return message;
  }

  async handleEvent(event) {
    const client = await this.getClient();
    if (!client) {
      return conosle.log('Client Not Present');
    }

    let matrixEvent = new MatrixEvent(event);
    // console.log('THE MATRIX EVENT', matrixEvent);
    if (event.type === 'm.room.encrypted') {
      try {
        let decryptedEvent = await client.crypto.decryptEvent(matrixEvent);
        // console.log('THE DECRYPTED EVENT: NEW METHOD', decryptedEvent);
        matrixEvent.claimedEd25519Key = decryptedEvent.claimedEd25519Key;
        matrixEvent.clearEvent = decryptedEvent.clearEvent;
        matrixEvent.forwardingCurve25519KeyChain =
          decryptedEvent.forwardingCurve25519KeyChain;
        matrixEvent.senderCurve25519Key = decryptedEvent.senderCurve25519Key;
        matrixEvent.untrusted = decryptedEvent.untrusted;
      } catch (e) {
        // console.log('THE EVENT HAS ISSUES', e);
        matrixEvent.claimedEd25519Key = null;
        matrixEvent.clearEvent = {
          content: {body: `Unable to decrypt message ${e}`, msgtype: 'm.text'},
          room_id: event.room_id,
          type: 'm.room.message',
        };
        matrixEvent.forwardingCurve25519KeyChain = null;
        matrixEvent.senderCurve25519Key = null;
        matrixEvent.untrusted = undefined;
      }
    }
    return matrixEvent;
  }

  async extractEventsInitialFromSync(allEvents) {
    const messageEvents = allEvents.filter(
      event =>
        event.type == 'm.room.message' || event.type == 'm.room.encrypted',
    );
    const matrixEvents = messageEvents.map(event => this.handleEvent(event));
    const resolveMatrixEvents = await Promise.all(matrixEvents);
    console.log('THE MESAAGES', resolveMatrixEvents);
    const extractMessageFromMatrixEvents = resolveMatrixEvents.map(event =>
      this.extractMessageFromMatrixEvent(event),
    );
    const resolveExtractedMessagesFromMatrixEvent = await Promise.all(
      extractMessageFromMatrixEvents,
    );
    console.log(
      'THE RESOLVED EXTACTED MESSAGES',
      resolveExtractedMessagesFromMatrixEvent,
      extractMessageFromMatrixEvents,
    );
    return resolveExtractedMessagesFromMatrixEvent;
  }

  async createRoom(opts) {
    const client = await this.getClient();
    const optsRoom = {
      name: opts.name,
      invite: opts.members,
      visibility: opts.visibility,
    };

    const roomId = await client.createRoom(optsRoom, opts.callback);
    console.log('Room Id in room creation', roomId);
    // if (roomId && opts.enableEncryption) {
    //   client.setRoomEncryption(roomId, {algorithm: 'm.megolm.v1.aes-sha2'});
    // }
    return roomId;
  }

  async registerAccount(username, password) {
    const client = await this.getClient();
    const registerUser = await client.register(username, password);
    return registerUser;
  }
}

const ChatService = new MatrixService();
module.exports = ChatService;
