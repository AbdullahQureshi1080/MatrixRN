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

// import matrix from '../../App';

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

export default function Rooms({navigation}) {
  const {store, dispatch} = useUserContext();

  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    console.log('THE MATRIX SERVICE CLIENT: ROOMS', ChatService);
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

  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  // const {isReady, isSynced} = useMatrix();

  // const {roomList, inviteList, updateLists} = useRoomList();
  //
  // console.log('THE ROOM LIST', roomList);

  const onRowPress = item => {
    navigation.navigate('Room', {room: item});
  };

  const onPressLogout = () => {
    removeUserMatrixData();
    logoutUser(dispatch);
  };

  const renderItem = ({item, inde}) => {
    const room = item;
    // const lastMessage = item.timeline.filter(
    //   ms => ms.event.type === 'm.room.message',
    // )[0];
    // console.log('THE MESSAGE', lastMessage);
    let roomName = room.name;
    return (
      <TouchableOpacity style={styles.ROOM} onPress={() => onRowPress(item)}>
        <Text style={styles.ROOM_NAME}>{roomName}</Text>
        {/* <Text style={styles.ROOM_MESSAGE}>{lastMessage}</Text> */}
      </TouchableOpacity>
    );
  };

  return (
    <Screen>
      <Text style={styles.SCREEN_TITLE}>Rooms</Text>
      {/* <RoomList onRowPress={onRowPress} /> */}
      <FlatList
        data={rooms}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
      <Button
        name={'Logout'}
        type="PRIMARY"
        size={'SMALL'}
        onPress={() => onPressLogout()}
      />
    </Screen>
  );
}
