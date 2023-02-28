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

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [fetchingRooms, setFetchingRooms] = useState(false);

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
    setUser(user);
    console.log('User already updated!');
  };

  useEffect(() => {
    setLoading(true);
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
    setFetchingRooms(true);
    setLoading(false);
    let rooms = await ChatService.getAllRooms(null);
    console.log('THE ROOMS', rooms);
    if (rooms) {
      // setLoading(false);
      // setFetchingRooms(false);
      setRooms(rooms);
    }
    // setRooms([]);
    setLoading(false);
    setFetchingRooms(false);
  };

  useEffect(() => {
    // setTimeout(() => {
    // setLoading(false);
    // setFetchingRooms(false);
    // }, 10);
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

  useEffect(() => {
    if (!isVisible) {
      setIncommingVerificationRequest(null);
    }
  }, [isVisible]);

  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  const onRowPress = item => {
    navigation.navigate('Room', {room: item});
  };

  const onPressLogout = async () => {
    // try {
    // setLoading(true);
    // setLoggingOut(true);
    const logout = await ChatService.stopClientAndDeleteStores();
    // if (typeof logout == 'object') {
    // setLoading(false);
    removeUserMatrixData();
    logoutUser(dispatch);
    alert('All data cleared.');

    // if (ChatService.client) {
    //   console.log('Client Exists', ChatService.client);

    // }
    // }
    console.log('COmes Here', logout);
    // } catch (error) {
    //   console.log('ERROR LOGGING OUT', error);
    //   setLoading(false);
    //   setLoggingOut(false);
    // }

    // indexedDB
    //   .databases()
    //   .then(r => {
    //     for (var i = 0; i < r.length; i++) indexedDB.deleteDatabase(r[i].name);
    //   })
    //   .then(() => {
    //   });
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
        <Text style={styles.SCREEN_TITLE}>MATRIX CHAT</Text>

        <TouchableOpacity
          onPress={() => {
            getRooms();
          }}>
          <Text style={styles.ROOM_MESSAGE}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size={'large'} color={color.textLight} />
          {loggingOut ? (
            <Text style={styles.LABEL}>Logging out......</Text>
          ) : null}
          {fetchingRooms ? (
            <Text style={styles.LABEL}>Getting Rooms.....</Text>
          ) : null}
        </View>
      ) : (
        <>
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
        name={'Save Backup'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => {
          // ChatService.sendBackupSever();
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
              if (user) {
                ChatService.getCrossSigningInfo(user);
              }
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
          <Button
            name={'SAVE BACKUP'}
            type="PRIMARY"
            size={'LARGE'}
            onPress={() => {
              ChatService.setAndEnableBackup(user);
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
        </>
      )}

      {loggingOut ? null : (
        <Button
          name={'Logout'}
          type="PRIMARY"
          size={'LARGE'}
          onPress={() => onPressLogout()}
        />
      )}

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
    </Screen>
  );
}
