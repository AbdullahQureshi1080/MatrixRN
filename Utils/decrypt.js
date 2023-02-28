import {
  decodeBase64,
  decryptAttachment,
  encodeBase64,
} from 'matrix-encrypt-attachment';

import RNFS from 'react-native-fs';
import {blobToBase64} from './Helpers';

var queueFetchPromise = Promise.resolve();

var queueFetch = function (url, options) {
  var newPromise = queueFetchPromise.then(
    function () {
      console.log('Retrieving ' + url + '...');

      var promiseWithRetries = fetch(url, options).catch(function (err) {
        console.log('ERROR retrieving ' + url + ' on first try: ', err);
        console.log('Trying again...');
        return fetch(url, options);
      });

      return promiseWithRetries;
    },
    function (err) {
      console.log('ERROR: The  previous item could not be retrieved: ', err);
      console.log('Retrieving ' + url + '...');
      return fetch(url, options);
    },
  );

  queueFetchPromise = newPromise;
  console.log('queueFetchPromise', queueFetchPromise);
  return newPromise;
};

export const decryptFile = async (client, file) => {
  if (!client) {
    return console.log('Client does not exist!');
  }
  if (!file) {
    return console.log('There is no file!');
  }
  console.log('CLIET IS', client, file);
  const url = client.mxcUrlToHttp(file.url);

  // const qF = await queueFetch(url);

  // console.log('qF', qF);

  //   const arrayBuffer = await qF.arrayBuffer();

  //   console.log('ARR BUFFER', arrayBuffer);

  const base64Raw = await blobToBase64(url);
  console.log('base64Raw', base64Raw);

  // const encodedBase64 = encodeBase64(await qF.arrayBuffer());

  // console.log('encodedBase64', encodedBase64);

  const base64 = base64Raw.slice(37, base64Raw.length);

  console.log('base64', base64);

  const decodedBase64 = decodeBase64(base64);

  console.log('decodedBase64', decodedBase64);

  //   const myBuffer = Buffer.from(base64, 'base64');

  //   console.log('MY BUFFER', myBuffer);

  const myArrayBuffer = new ArrayBuffer(decodedBase64);

  console.log('Array BUFFER', myArrayBuffer);

  const decryptedAttachment = await decryptAttachment(myArrayBuffer, file);

  console.log('Decrypted attackment', decryptedAttachment);

  //   const readFile = RNFS.readFile(url, 'base64');

  //   console.log('READ FILE', readFile);

  //   const qF = await queueFetch(url);

  //   console.log('qF', qF);
  //   const isblob = await qF.blob();
  //   //   const isarrayBuffer = qF.arrayBuffer();
  //   //   console.log('isarrayBuffer', isarrayBuffer);
  //   console.log('blob', isblob);

  //   const fileReader = new FileReader();

  //   // read the file
  //   fileReader.readAsDataURL(isblob);

  //   fileReader.onloadend = function () {
  //     console.log('REsult', fileReader.result.slice(0, 37));
  //     // resolve(fileReader.result); // Here is the base64 string
  //     const decodedBase64 = decodeBase64(fileReader.result.slice(0, 37));

  //     console.log('decodedBase64', decodedBase64);
  //   };

  //   const base64 = fileReader.readAsDataURL(isblob);

  //   console.log('Base64', base64);

  //   const decodedBase64 = decodeBase64(base64);

  //   console.log('decodedBase64', decodedBase64);
  //   // read the file
  //   fileReader.readAsDataURL(isblob);

  //   fileReader.onloadend = function () {
  //     console.log('REsult', fileReader.result);
  //     resolve(fileReader.result); // Here is the base64 string
  //   };
  //   console.log('arrayBuffer', isarrayBuffer);

  //   const decryptedAttachment = decryptAttachment(isarrayBuffer, file);

  //   console.log('Deccrypted attackment', decryptedAttachment);
  //   Download the encrypted file as an array buffer.
  //   return queueFetch(url)
  //     .then(function (response) {
  //       //   RNFS.readFile(response, 'base64').then(res => {
  //       //     console.log(res);
  //       //     const byteArray = decodeBase64(res);
  //       //     console.log('BUTE ARRAY', byteArray);
  //       //     return res;
  //       //   });
  //       //   const arrayBuffer = new ArrayBuffer(response.arrayBuffer());
  //       //   const fileReader = new FileReader();
  //       //   //   const file = fileReader.readAsDataURL(response);
  //       //   //   //   var byteArray = decodeBase64(response);
  //       //   //   const resJ = response.arrayBuffer();
  //       //   //   console.log('RES IN QF', resJ);
  //       //   const blob = response.blob().then(res => {
  //       //     console.log('HEYLO', res._data);
  //       //   });
  //       // const frBlob = fileReader.readAsDataURL(blob);
  //       //   console.log('RES IN QF', frBlob);
  //     })
  //     .then(function (responseData) {
  //       console.log('Res Data', responseData);
  //       // Decrypt the array buffer using the information taken from
  //       // the event content.
  //       //   return decryptAttachment(responseData, file);
  //     });

  //   return queueFetch(url)
  //     .then(function (response) {
  //       console.log('res', response);
  //       console.log('resArrayBuffer', response.arrayBuffer());
  //       return response.arrayBuffer();
  //     })
  //     .then(function (responseData) {
  //       console.log('responseData', responseData);
  //       // Decrypt the array buffer using the information taken from
  //       // the event content.
  //       return decryptAttachment(responseData, file);
  //     });
};
