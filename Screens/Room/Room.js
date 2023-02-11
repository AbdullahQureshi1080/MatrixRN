import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';

import Screen from '../../Components/Screen/Screen';
import newStyles from './RoomStyles';

import Button from '../../Components/Button/Button';
import MatrixService from '../../Services/MatrixChatService';

import ChatComponent from '../../Components/Chat/ChatComponent';

import '../../Services/poly';

if (!Promise.allSettled) {
  Promise.allSettled = promises =>
    Promise.all(
      promises.map((promise, i) =>
        promise
          .then(value => ({status: 'fulfilled', value}))
          .catch(reason => ({status: 'rejected', reason})),
      ),
    );
}

const ChatService = MatrixService;

export default function Room({route, navigation}) {
  console.log('THE MATRIX SERVICE IN ROOM', ChatService);
  const {room} = route.params;
  // console.log('THE ROOM IN ROOM ', room);
  const roomId = room.roomId;
  if (!room) navigation.goBack();
  useEffect(() => {
    console.log('ROOM', room);
  }, []);

  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  const roomId_ =
    roomId && roomId !== '' ? roomId : '!CJxAgKJgRiZlFmVlfp:chat.instacured.io';
  // let roomId_ = props.roomId;
  if (!roomId_) {
    throw new Error('roomId is required. Provide a `roomId` prop');
  }

  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPresence, setUsersPresence] = useState([]);

  const messageRef = useRef();
  messageRef.current = messages;

  const usersPresenceRef = useRef();
  usersPresenceRef.current = usersPresence;

  useEffect(() => {
    if (!ready) {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    console.log('THE READy', ready);

    if (!ready) {
      return;
    }

    getMessages()
      .then(msgs => {
        setMessages(msgs);
      })
      .catch(console.log);

    ChatService.getCurrentUser()
      .then(user => {
        setCurrentUser(user);
      })
      .catch(console.log);

    ChatService.getRoomMembers(roomId)
      .then(members => {
        setUsers(members);
        for (let m of members) {
          ChatService.onPresense(m.id, res => {
            let userId = res.userId;
            let presences = [...usersPresenceRef.current];
            presences = presences.filter(u => u.userId !== userId);
            presences = [...presences, res];
            setUsersPresence(presences);
          });
        }
      })
      .catch(console.log);

    return () => {
      setMessages([]);
    };
  }, [ready]);

  const getMessages = async () => {
    let messages = await ChatService.getRoomMessagesFromRoomID(roomId);

    ChatService.onMessageReceive(roomId, (msg, event, userId) => {
      console.log('THE NEW MESSAGE', msg);
      let list = [...messageRef.current];

      if (msg) {
        list = [...messageRef.current, msg];
      }
      console.log('EVENT > SENDER ID > USER ID', event?.sender?.userId);
      console.log('USER ID', userId);

      if (event?.sender?.userId !== userId) {
        // Alert.alert('Hi');
        console.log('READING MESSAGE', event);
        list.filter(m => {
          if (m.from.id !== event?.sender?.id) {
            if (m.from.id == userId) {
              m.read = true;
            }
          }
        });
      }

      console.log('The Messages: in get Messages', list);
      setMessages(list);
    });
    console.log('Messages:Lists', messages);
    return messages;
  };

  const uploadImage = async image => {
    let uploadResponse = await ChatService.uploadContent(image, {
      rawResponse: false,
      type: image.type,
      onlyContentUri: false,
    });
    console.log('The Uplaod respone', uploadResponse);
    return uploadResponse;
  };

  const onPressRequestRoomKeys = () => {
    ChatService.requestRoomKeys(roomId, messages[messages.length - 1]);
  };

  return (
    <Screen>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text>Back</Text>
      </TouchableOpacity>
      <Text style={styles.SCREEN_TITLE}>Room</Text>

      <Button
        name={'Request Room Keys'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => onPressRequestRoomKeys()}
      />

      <ChatComponent
        // matrixCredentials={room}
        usersPresence={usersPresence}
        messages={messages}
        currentUser={currentUser}
        users={users}
        onMicrophoneClick={() =>
          ChatService.getRoomMembers(roomId)
            .then(console.log)
            .catch(console.log)
        }
        onMessageSend={msg => {
          ChatService.sendTextMessageToRoom(roomId, msg.message);
        }}
        onImageMessageSend={msg => {
          ChatService.sendImageMessageToRoom(roomId, msg);
        }}
        uploadImage={uploadImage}
      />
    </Screen>
  );
}
