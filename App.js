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

import {getUserMatrixData, storeUserMatrixData} from './Utils/Storage';

import {useObservableState} from 'observable-hooks';
import {
  AppProvider,
  setLoggedInUser,
  useUserContext,
} from './Context/AppContext';
import Config from 'react-native-config';
import Screen from './Components/Screen/Screen';

LogBox.ignoreAllLogs(true);

import ChatService from './Services/MatrixChatService';
import {getUserFromDatabase} from './database/db';
import {getDeviceID} from './Utils/Device';

// let matrix = new MatrixService();

// import matrix from './rn-matrix/services/matrix';

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
  // const [matrix, setMatrix] = useState(null);
  const {store, dispatch} = useUserContext();

  console.log('THE STORE ', store);
  const [userMatrixData, setUserMatrixData] = useState(null);

  const getMatrixData = async () => {
    let userMD = await getUserMatrixData();
    console.log('THE USER MD DATA', userMD);
    if (userMD) {
      const user = await getUserFromDatabase(userMD.id);
      let alteredRes = {...user};
      alteredRes.accessToken = alteredRes.devices.filter(
        dec => dec.nativeDeviceId == getDeviceID(),
      )[0].accessToken;
      alteredRes.deviceId = alteredRes.devices.filter(
        dec => dec.nativeDeviceId == getDeviceID(),
      )[0].deviceId;
      setUserMatrixData(alteredRes);
      storeUserMatrixData(alteredRes);
    }
  };

  useEffect(() => {
    getMatrixData();
  }, []);

  useEffect(() => {
    if (userMatrixData) {
      // setTimeout(() => {
      setLoggedInUser(dispatch, userMatrixData);
      console.log('THE STORAGE DATA', userMatrixData);
      ChatService.init(userMatrixData);
      // }, 2000);

      return;
    }
  }, [userMatrixData]);

  useEffect(() => {
    console.log('The STORE IS UPDATED', store);
  }, [store.isAuthenticated]);

  return (
    <NavigationContainer>
      {store && store.isAuthenticated && ChatService.ready ? (
        <AppStack />
      ) : (
        <AuthStack />
      )}
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

export default APPWRAPPER;
