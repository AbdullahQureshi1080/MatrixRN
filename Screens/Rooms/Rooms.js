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

import rnm from '@rn-matrix/core';
import {useMatrix, useRoomList} from '@rn-matrix/core';
import {RoomList} from '@rn-matrix/ui';
import Config from 'react-native-config';
import {getUserMatrixData, removeUserMatrixData} from '../../Utils/Storage';
import Button from '../../Components/Button/Button';
import {logoutUser, useUserContext} from '../../Context/AppContext';

// import {matrix} from '@rn-matrix/core';

export default function Rooms({navigation}) {
  const {store, dispatch} = useUserContext();

  // useEffect(() => {
  //   console.log('THE IS READY', isReady);
  //   console.log('THE IS SYNCED', isSynced);
  // }, []);

  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  const {isReady, isSynced} = useMatrix();

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

  const renderItem = () => {
    return (
      <View>
        <Text>Hello</Text>
      </View>
    );
  };

  if (!isReady || !isSynced) {
    return (
      <Screen>
        <View style={styles.ACIVITY_WAIT_VIEW}>
          <ActivityIndicator size={'large'} style={styles.ACTIVITY_INDICATOR} />
        </View>
      </Screen>
    );
  }
  return (
    <Screen>
      <Text style={styles.SCREEN_TITLE}>Rooms</Text>
      <RoomList onRowPress={onRowPress} />
      <Button
        name={'Logout'}
        type="PRIMARY"
        size={'SMALL'}
        onPress={() => onPressLogout()}
      />
      {/* <FlatList data={roomList} renderItem={renderItem} /> */}
    </Screen>
  );
}
