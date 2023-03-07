import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  useColorScheme,
  Alert,
} from 'react-native';
import React, {useState, useReducer} from 'react';

import Screen from '../../../Components/Screen/Screen';

import newStyles from './RegisterStyles';
import Button from '../../../Components/Button/Button';
import {initialUser, userReducer} from '../../../Store/User';

import Config from 'react-native-config';

import {initialLoad, loadReducer} from '../../../Store/Load';
import {useNavigation} from '@react-navigation/native';
import {storeUserMatrixData} from '../../../Utils/Storage';

import {loginUser, useUserContext} from '../../../Context/AppContext';

// import matrix from '../../../App';
// import MatrixService from '../../../Services/MatrixChatService';

import matrix from '../../../App';
import MatrixService from '../../../Services/MatrixChatService';
import {addUserToDatabase} from '../../../database/db';
import {getDeviceID} from '../../../Utils/Device';
import {decryptPassword, encryptPassword} from '../../../Utils/Helpers';
import {color} from '../../../Utils/Color';

function Register(props) {
  const {store, dispatch} = useUserContext();
  // const store = RootStore;
  const navigation = useNavigation();
  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  const [emailSwitch, setEmailSwitch] = useState(false);

  const [user, userDispatch] = useReducer(userReducer, initialUser);
  const [load, loadDispatch] = useReducer(loadReducer, initialLoad);

  const loginToHomeserver = async (username, password) => {
    console.log('THE USERNAME', username);
    console.log('THE PASSWORD', password);
    if (!username || !password) {
      return Alert.alert('Please enter username & password');
    }

    const result = await MatrixService.registerAccount(username, password);
    console.log('THE RESULT', result);
    if (result && !result.error) {
      let alteredRes = {...result};
      delete alteredRes.deviceId;
      delete alteredRes.accessToken;
      addUserToDatabase(alteredRes);
      storeUserMatrixData(result);
      loginUser(dispatch, result);
      return;
    }
  };

  return (
    <Screen>
      <Text style={styles.SCREEN_TITLE}>MATRIX CHAT</Text>
      <View style={styles.SECTION_CONTAINER}>
        <Text style={styles.SECTION_TITLE}>Register</Text>
        <View style={styles.INPUT_BOX}>
          <Text style={styles.LABEL}>Username</Text>
          <TextInput
            style={styles.INPUT}
            placeholder="Username"
            onChangeText={text => {
              userDispatch({type: 'SET_USERNAME', payload: text});
            }}
            name="username"
          />
        </View>
        <View style={styles.INPUT_BOX}>
          <Text style={styles.LABEL}>Password</Text>
          <TextInput
            style={styles.INPUT}
            placeholder="Email"
            onChangeText={text => {
              userDispatch({type: 'SET_PASSWORD', payload: text});
            }}
            name="password"
          />
        </View>
      </View>
      <Button
        name={load.loading ? 'Loading' : 'Register'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => loginToHomeserver(user.username, user.password)}
        disabled={load.loading}
      />
      <Button
        name={load.loading ? 'Loading' : 'Back to Login'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => navigation.navigate('Login')}
        disabled={load.loading}
        containerStyle={{backgroundColor: color.info}}
      />
    </Screen>
  );
}

export default Register;
