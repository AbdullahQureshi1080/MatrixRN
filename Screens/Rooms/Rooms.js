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
import {
  getUserMatrixData,
  removeUserMatrixData,
  storeUserMatrixData,
} from '../../Utils/Storage';
import Button from '../../Components/Button/Button';
import {logoutUser, useUserContext} from '../../Context/AppContext';
import ChatService from '../../Services/MatrixChatService';
import VerificationModal from '../Verification/Verification';
import CreateRoom from '../CreateRoom/CreateRoom';

import '../../Services/poly';
import {IndexedDBCryptoStore, IndexedDBStore} from 'matrix-js-sdk';
import {color} from '../../Utils/Color';
import {
  getAllUsersFromDatabase,
  getUserFromDatabase,
  updateUserInDatabase,
} from '../../database/db';
import {getDeviceID} from '../../Utils/Device';

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
  const [isRoomVisible, setIsRoomVisible] = useState(false);

  const [incomingVerificationRequest, setIncommingVerificationRequest] =
    useState(null);

  // Verification Actions  &  States

  // const [emojies, setEmojies] = useState([]);

  const getUsers = async () => {
    const users = await getAllUsersFromDatabase();
    const currentUser = await getUserMatrixData();
    console.log('getUsers:users:currentUsers', users, currentUser);
    const user = users.filter(us => us.userId == currentUser.userId)[0];
    console.log('getUsers:User', user);
    if (user && !currentUser.id) {
      console.log('User updated!');
      storeUserMatrixData(user);
      return updateUserInDatabase(user);
    }
    console.log('User already updated!');
  };

  useEffect(() => {
    getUsers();
    console.log('THE MATRIX SERVICE CLIENT: ROOMS', ChatService);
    ChatService.onGlobalListener(setIncommingVerificationRequest);

    // if (ChatService) {
    getRooms();
    // }
  }, []);

  // useEffect(() => {
  //   const cryptoEnabled = ChatService?.client?.isCryptoEnabled();
  //   if (cryptoEnabled) {
  //     console.log('Encryption is enabled', cryptoEnabled);
  //     // alert('Encryption is enabled', cryptoEnabled);
  //     ChatService.getCrossSigningInfo();
  //   }
  // }, [ChatService?.client?.isCryptoEnabled()]);

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
      // ChatService.getBackup()
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

  const onPressLogout = async () => {
    // const backup = await ChatService.setAndEnableBackup();
    // if (backup) {
    window.indexedDB
      .databases()
      .then(r => {
        for (var i = 0; i < r.length; i++) indexedDB.deleteDatabase(r[i].name);
      })
      .then(() => {
        removeUserMatrixData();
        logoutUser(dispatch);
        alert('All data cleared.');
      });
    // }
    // const storeCleared = await
    // ChatService.stopClientAndDeleteStores();
    // ChatService.getAllRooms(null);
    // console.log('STORE CLEARED', storeCleared);
    // if (storeCleared) {
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
    if (callbackData) {
      getRooms();
    }
  };

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: 20,
        }}>
        <Text style={styles.SCREEN_TITLE}>Rooms</Text>

        <TouchableOpacity onPress={getRooms}>
          <Text style={styles.ROOM_MESSAGE}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <Button
        name={'Create Room'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => setIsRoomVisible(true)}
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
        labelStyle={{color: color.textLight}}
      />
      {/* <Button
        name={'SetupBackup'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => {
          ChatService.setAndEnableBackup();
        }}
        style={{
          borderRadius: 8,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
        }}
        labelStyle={{color: color.textLight}}
      /> */}
      {/* <Button
        name={'See Cross Signing Info'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => {
          ChatService.getCrossSigningInfo();
        }}
        style={{
          borderRadius: 8,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
        }}
        labelStyle={{color: color.textLight}}
      /> */}
      {/* <Button
        name={'Get Data from Database'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => {
          getAllUsersFromDatabase();
          getUserFromDatabase('jxKHqMHHXE6589cYr5Ze');
          getDeviceID();
        }}
        style={{
          borderRadius: 8,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
        }}
        labelStyle={{color: color.textLight}}
      /> */}

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

      {isRoomVisible && (
        <CreateRoom
          isVisible={isRoomVisible}
          setIsVisible={setIsRoomVisible}
          ChatService={ChatService}
          callbackRoom={callbackRoom}
        />
      )}

      {/* <Button
        name={'Press Me'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => onPressLogout()}
      /> */}

      <Button
        name={'Logout'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => onPressLogout()}
      />
    </Screen>
  );
}
