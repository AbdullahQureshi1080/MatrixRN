/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useContext, useEffect, useReducer, useState} from 'react';
import {ActivityIndicator, LogBox, View} from 'react-native';

import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from './Screens/Auth/Login/Login';
import Rooms from './Screens/Rooms/Rooms';
import Room from './Screens/Room/Room';
import Register from './Screens/Auth/Register/Register';

import {getUserMatrixData} from './Utils/Storage';

import {useObservableState} from 'observable-hooks';
import {
  AppProvider,
  setLoggedInUser,
  useUserContext,
} from './Context/AppContext';
import Config from 'react-native-config';
import Screen from './Components/Screen/Screen';

LogBox.ignoreAllLogs(true);

const Stack = createNativeStackNavigator();

const AuthStack = ({}) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
};
const AppStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Rooms"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Rooms" component={Rooms} />
      <Stack.Screen name="Room" component={Room} />
    </Stack.Navigator>
  );
};

const App = props => {
  const {store, dispatch} = useUserContext();

  console.log('THE STORE ', store);
  const [userMatrixData, setUserMatrixData] = useState(null);

  const getMatrixData = async () => {
    let userMD = await getUserMatrixData();
    console.log('THE USER MD DATA', userMD);
    if (userMD) {
      setUserMatrixData(userMD);
      // await dispatch({type: 'LOGGED_IN', data: []});
    }
  };

  useEffect(() => {
    getMatrixData();
  }, []);

  useEffect(() => {
    if (userMatrixData) {
      setLoggedInUser(dispatch, userMatrixData);
      // matrix.createClient(
      //   Config.CHAT_SERVER_URL,
      //   userMatrixData.accessToken,
      //   userMatrixData.userId,
      //   userMatrixData.deviceId,
      // );
      return;
    }
  }, [userMatrixData]);

  return (
    <NavigationContainer>
      {store && store.isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const APPWRAPPER = () => {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
};

export default observer(APPWRAPPER);
