import DeviceInfo from 'react-native-device-info';

export const getDeviceID = () => {
  const deviceId = DeviceInfo.getDeviceId();
  console.log('Device ID from react-native-device-info', deviceId);
  return deviceId;
};
