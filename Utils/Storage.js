import AsyncStorage from '@react-native-community/async-storage';

let key = 'USER_MATRIX_DATA';

const storeUserMatrixData = async userMatrixData => {
  try {
    let alteringData = userMatrixData;
    if (typeof userMatrixData === 'object') {
      alteringData = JSON.stringify(userMatrixData);
    }
    await AsyncStorage.setItem(key, alteringData);
  } catch (err) {
    console.log(`Error storing ${key}`, err);
  }
};

const getUserMatrixData = async () => {
  try {
    let dataFromStorage = await AsyncStorage.getItem(key);
    let userMatrixData = JSON.parse(dataFromStorage);
    if (typeof userMatrixData === 'object') {
      return userMatrixData;
    }
    return dataFromStorage;
  } catch (err) {
    console.log(`Error getting ${key}`, err);
  }
};

const removeUserMatrixData = async () => {
  try {
    await AsyncStorage.removeItem(key);
    console.log('Token Removed');
  } catch (err) {
    console.log(`Error removing ${key}`, err);
  }
};

export {storeUserMatrixData, getUserMatrixData, removeUserMatrixData};
