import React from 'react';
import {
  getUserMatrixData,
  removeUserMatrixData,
  storeUserMatrixData,
} from '../Utils/Storage';
const AppContext = React.createContext(null);
function appReducer(store = null, action) {
  switch (action.type) {
    case 'REGISTER':
      return {
        isAuthenticated: true,
        data: action.data,
      };
    case 'LOGGED_IN':
      console.log('THE DATA', action);
      return {
        isAuthenticated: true,
        data: action.data,
      };
    case 'LOGIN_SUCCESS':
      return {
        isAuthenticated: true,
        data: action.data,
      };
    case 'LOGOUT':
      return {
        ...store,
        isAuthenticated: false,
      };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function AppProvider({children}) {
  // let userData = await getUserMatrixData()
  const [store, dispatch] = React.useReducer(appReducer, {
    isAuthenticated: false,
    data: null,
  });
  const value = {store, dispatch};
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
function useUserContext() {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useCount must be used within a CountProvider');
  }
  return context;
}

const registerUser = async (dispatch, data, token) => {
  try {
    storeUserMatrixData(data);
    await dispatch({type: 'REGISTER', data});
  } catch (e) {
    console.log(e);
  }
};
const loginUser = async (dispatch, data, token) => {
  console.log('THE DATA IN LOGIN', data);
  try {
    storeUserMatrixData(data);
    await dispatch({type: 'LOGIN_SUCCESS', data});
  } catch (e) {
    console.log(e);
  }
};
const logoutUser = async dispatch => {
  try {
    removeUserMatrixData();
    await dispatch({type: 'LOGOUT'});
  } catch (error) {
    console.log('ERROR AT CONTEXT:', error);
  }
};

const setLoggedInUser = async (dispatch, data) => {
  console.log('THE DATA IN LOGGED', data);
  try {
    storeUserMatrixData(data);
    await dispatch({type: 'LOGGED_IN', data});
  } catch (error) {
    console.log('ERROR AT CONTEXT:', error);
  }
};

export {
  AppProvider,
  useUserContext,
  registerUser,
  loginUser,
  logoutUser,
  setLoggedInUser,
};
