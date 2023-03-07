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

import newStyles from './LoginStyles';
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
import {updateUserInDatabase} from '../../../database/db';
import {color} from '../../../Utils/Color';

// import {
//   IsLoggedIn,
//   Login as AuthLogin,
//   MatrixService,
//   StartClient,
// } from '../../../matrix-helpers/matrix';
// import {PrepareSync} from '../../../matrix-helpers/sync';

function Login(props) {
  const {store, dispatch} = useUserContext();
  // const store = RootStore;
  const navigation = useNavigation();
  const isDarkMode = useColorScheme() === 'dark';
  const styles = newStyles(isDarkMode);

  const [emailSwitch, setEmailSwitch] = useState(false);

  const [user, userDispatch] = useReducer(userReducer, initialUser);
  const [load, loadDispatch] = useReducer(loadReducer, initialLoad);

  const loginToHomeserver = async (username, password) => {
    console.log('THE User', user, Config.CHAT_SERVER_URL);
    console.log('THE USERNAME', username);
    console.log('THE PASSWORD', password);
    if (!username || !password) {
      return Alert.alert('Please enter username & password');
    }
    const result = await MatrixService.loginWithPassword(
      username,
      password,
      Config.CHAT_SERVER_URL,
      true, // enable crypto? default false
    );
    console.log('THE RESULT', result);
    if (result && !result.error) {
      let alteredRes = {...result};
      delete alteredRes.accessToken;
      delete alteredRes.deviceId;
      updateUserInDatabase(alteredRes);
      storeUserMatrixData(result);
      loginUser(dispatch, result);
      return;
    }
  };

  return (
    <Screen>
      <Text style={styles.SCREEN_TITLE}>MATRIX CHAT</Text>
      {/* <Text>{JSON.stringify(store)}</Text> */}
      <View style={styles.SECTION_CONTAINER}>
        <Text style={styles.SECTION_TITLE}>Login</Text>
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
        name={load.loading ? 'Loading' : 'Login'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => loginToHomeserver(user.username, user.password)}
        disabled={load.loading}
      />
      <Button
        name={'Register'}
        type="PRIMARY"
        size={'LARGE'}
        onPress={() => navigation.navigate('Register')}
        containerStyle={{backgroundColor: color.info}}
        // disabled={load.loading}
      />
    </Screen>
  );
}

export default Login;
