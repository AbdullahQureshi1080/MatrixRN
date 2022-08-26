import AsyncStorage from '@react-native-community/async-storage';

const debug = require('debug')('ditto:services:storage');

class Storage {
  async getItem(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      return JSON.parse(val);
    } catch (e) {
      debug('Error getting storage item: ', e);
      console.warn('Error getting storage item: ', e);
      return null;
    }
  }

  async setItem(key, value) {
    return AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async clear() {
    return AsyncStorage.clear();
  }
}

const storage = new Storage();
export default storage;
