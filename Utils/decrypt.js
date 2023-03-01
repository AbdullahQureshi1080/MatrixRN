import {
  decodeBase64,
  decryptAttachment,
  encodeBase64,
} from 'matrix-encrypt-attachment';

import RNFetchBlob from 'rn-fetch-blob';

import RNFS from 'react-native-fs';

import {
  arrayBufferToBase64,
  blobToBase64,
  directBlobToBase64,
  toBuffer,
} from './Helpers';

export const decryptFile = async (client, file) => {
  if (!client) {
    return console.log('Client does not exist!');
  }
  if (!file) {
    return console.log('There is no file!');
  }
  const url = client.mxcUrlToHttp(file.url);
  const base64Raw = await blobToBase64(url);
  const base64 = base64Raw.split(',')[1];
  const decodedBase64 = decodeBase64(base64);
  const decryptedAttachment = await decryptAttachment(decodedBase64, file);
  console.log('Decrypted attackment', decryptedAttachment);
  const arB = arrayBufferToBase64(decryptedAttachment);
  return arB;
};
