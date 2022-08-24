// const initialAppState = {
//   matrixData: null,
//   isLogin: false,
// };

// function appReducer(state, action) {
//   switch (action.type) {
//     case 'MATRIX_DATA':
//       return {...state, matrixData: action.payload};
//     case 'IS_LOGIN':
//       return {...state, isLogin: action.payload};
//     case 'LOGIN_SUCCESS':
//       return {
//         ...state,
//         isLogin: action.payload.isLogin,
//         matrixData: action.payload.matrixData,
//       };
//     default:
//       return state;
//   }
// }

// export {appReducer, initialAppState};

import {types} from 'mobx-state-tree';

const AppModel = types.model({
  isLogin: types.boolean,
  matrixData: types.optional(types.model(MatrixModel), {}),
});

const MatrixModel = types.model({
  accessToken: types.optional(types.string, ''),
  crypto: types.optional(types.boolean, false),
  deviceId: types.optional(types.string, ''),
  homeserver: types.optional(types.string, ''),
  userId: types.optional(types.string, ''),
});

const UserModel = types
  .model({
    username: types.optional(types.string, ''),
    password: types.optional(types.string, ''),
  })
  .actions(self => ({
    setUsername(username) {
      self.username = username;
    },
    setPassword(password) {
      self.password = password;
    },
    setUsernameAndPassword(username, password) {
      self.username = username;
      self.password = password;
    },
  }));

const RootStore = types
  .model({
    user: types.map(UserModel),
    matrix: types.map(MatrixModel),
    app: types.map(AppModel),
  })
  .views(self => ({
    get isLogin() {
      return values(self.isLogin);
    },
    get matrixData() {
      return values(self.matrixData);
    },
    get appState() {
      return values({isLogin: self.isLogin, matrixData: self.matrixData});
    },
  }))
  .actions(self => ({
    setIsLogin(isLogin) {
      self.isLogin = isLogin;
    },
    setMatrixData(matrixData) {
      self.matrixData = matrixData;
    },
    setAppState(isLogin, matrixData, user) {
      self.app.isLogin = isLogin;
      self.app.matrix = matrixData;
      self.user.username = user.username;
      self.user.password = user.password;
    },
  }))
  .create({});

export {RootStore, MatrixModel, AppModel, UserModel};
