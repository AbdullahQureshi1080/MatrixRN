import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  useColorScheme,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useReducer, useEffect} from 'react';

import newStyles from './CreateRoomStyles';

import {useNavigation} from '@react-navigation/native';

import matrix from '../../App';
import MatrixService from '../../Services/MatrixChatService';
import Button from '../../Components/Button/Button';

import {CryptoService, StartVerification} from '../../Services/crypto';
import {color} from '../../Utils/Color';

function CreateRoom({isVisible, setIsVisible, callbackRoom, ChatService}) {
  const [roomData, setRoomData] = useState({});
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  const onPressCreateRoom = () => {
    // Use to create a new room
    const opts = {
      name: roomData.name,
      members: roomData.members,
      enableEncryption: true,
      visibility: 'private',
      topic: 'Random',
      callbackRoom: callbackRoom,
    };
    console.log('OPTS', opts);
    ChatService.createRoom(opts);
    setIsVisible(false);
    setRoomData({});
  };

  return (
    <Modal visible={isVisible}>
      <View style={{flex: 1}}>
        <Text style={styles.SCREEN_TITLE}>Room Creation</Text>
        <View style={styles.SECTION_CONTAINER}>
          <Text style={styles.LABEL}>Name</Text>
          <TextInput
            style={styles.INPUT}
            placeholder="Name"
            onChangeText={text => {
              setRoomData({
                ...roomData,
                name: text,
              });
            }}
            name="username"
          />
          <Text style={styles.LABEL}>Add User to Room</Text>
          <TextInput
            style={styles.INPUT}
            placeholder="Username"
            onChangeText={text => {
              setRoomData({
                ...roomData,
                members: [`@${text}:localhost`],
              });
            }}
            name="username"
          />
        </View>

        <View style={styles.SECTION_CONTAINER}>
          <Button
            name={'Create Room'}
            type="PRIMARY"
            size={'MEDIUM'}
            onPress={() => {
              onPressCreateRoom();
            }}
            containerStyle={{backgroundColor: color.success}}
            labelStyle={{color: color.greyLight}}
          />
        </View>
      </View>
      <Button
        name={'Close'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => setIsVisible(false)}
      />
    </Modal>
  );
}

export default CreateRoom;
