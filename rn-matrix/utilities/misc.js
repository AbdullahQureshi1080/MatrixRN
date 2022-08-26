import { Platform } from 'react-native';

export function toImageBuffer(data) {
  return Buffer.from(data, 'base64');
}
