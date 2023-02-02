import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';

import Screen from '../../Components/Screen/Screen';
import newStyles from './RoomsStyles';

import Config from 'react-native-config';
import {getUserMatrixData, removeUserMatrixData} from '../../Utils/Storage';
import Button from '../../Components/Button/Button';
import {logoutUser, useUserContext} from '../../Context/AppContext';
import ChatService from '../../Services/MatrixChatService';
import VerificationModal from '../Verification/Verification';

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

// import {
//   IsLoggedIn,
//   Login,
//   MatrixService,
//   StartClient,
// } from '../../matrix-helpers/matrix';
// import {PrepareSync} from '../../matrix-helpers/sync';

export default function Rooms({navigation}) {
  const {store, dispatch} = useUserContext();

  const [rooms, setRooms] = useState([]);

  const [isVisible, setIsVisible] = useState(false);

  const [incomingVerificationRequest, setIncommingVerificationRequest] =
    useState(null);

  // Verification Actions  &  States

  // const [emojies, setEmojies] = useState([]);

  useEffect(() => {
    console.log('THE MATRIX SERVICE CLIENT: ROOMS', ChatService);
    ChatService.onGlobalListener(setIncommingVerificationRequest);
    // if (ChatService) {
    getRooms();
    // }
  }, []);

  const getRooms = async () => {
    let rooms = await ChatService.getAllRooms(null);
    console.log('THE ROOMS', rooms);
    if (rooms) {
      return setRooms(rooms);
    }
  };

  useEffect(() => {
    if (rooms.length) {
      console.log('THE ROOMS: ROOMS', rooms);
    }
  }, [rooms]);

  useEffect(() => {
    if (incomingVerificationRequest) {
      setIsVisible(true);
    }
  }, [incomingVerificationRequest]);

  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  const onRowPress = item => {
    navigation.navigate('Room', {room: item});
  };

  const onPressLogout = () => {
    removeUserMatrixData();
    logoutUser(dispatch);
  };

  const renderItem = ({item, inde}) => {
    const room = item;
    let roomName = room.name;
    return (
      <TouchableOpacity style={styles.ROOM} onPress={() => onRowPress(item)}>
        <Text style={styles.ROOM_NAME}>{roomName}</Text>
        {/* <Text style={styles.ROOM_MESSAGE}>{lastMessage}</Text> */}
      </TouchableOpacity>
    );
  };

  const callbackRoom = callbackData => {
    console.log('Hello Room is created', callbackData);
  };

  const onPressCreateRoom = () => {
    // Use to create a new room
    const opts = {
      name: 'Dount Day',
      members: ['@red:localhost'],
      enableEncryption: true,
      visibility: 'private',
      topic: 'Wisconsin Group High',
      callbackRoom,
    };
    ChatService.createRoom(opts);
    getRooms();
  };

  return (
    <Screen>
      <Text style={styles.SCREEN_TITLE}>Rooms</Text>

      <Button
        name={'Create Room'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => onPressCreateRoom()}
      />

      <Button
        name={'Start Verification'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => {
          if (!rooms) {
            return alert('Syncing in progress, please wait');
          }
          setIsVisible(true);
        }}
        style={{
          borderRadius: 8,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
        }}
      />

      <FlatList
        data={rooms}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />

      {isVisible && (
        <VerificationModal
          isVisible={isVisible}
          setIsVisible={setIsVisible}
          ChatService={ChatService}
          verificationRequest={incomingVerificationRequest}
        />
      )}

      <Button
        name={'Logout'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => onPressLogout()}
      />
    </Screen>
  );
}
