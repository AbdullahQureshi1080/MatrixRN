import {Base64} from 'js-base64';

export const encryptPassword = password => {
  console.log('BARE PASSWORD', password);
  var encode = Base64.encode(password);
  console.log('ENCODED', encode);
  return encode;
};

export const decryptPassword = password => {
  console.log('ENCODED', password);
  var decode = Base64.decode(password);
  console.log('DECODED', decode);
  return decode;
};

export const blobToBase64 = url => {
  return new Promise(async (resolve, _) => {
    // do a request to the blob uri
    const response = await fetch(url);

    // console.log('Response', blob);

    // response has a method called .blob() to get the blob file
    const blob = await response.blob();

    // console.log('BLOB IS', blob);

    // instantiate a file reader
    const fileReader = new FileReader();

    // read the file
    fileReader.readAsDataURL(blob);

    fileReader.onloadend = function () {
      // console.log('Result', fileReader.result);
      resolve(fileReader.result); // Here is the base64 string
    };
  });
};

export const directBlobToBase64 = blob => {
  return new Promise(async (resolve, _) => {
    const fileReader = new FileReader();
    // read the file
    fileReader.readAsDataURL(blob);
    fileReader.onloadend = function () {
      console.log('Result', fileReader.result);
      resolve(fileReader.result); // Here is the base64 string
    };
  });
};

export function getBlobSafeMimeType(mimetype) {
  // if (!ALLOWED_BLOB_MIMETYPES.includes(mimetype)) {
  return 'application/octet-stream';
  // }
  // return mimetype;
}

export function toBuffer(arrayBuffer) {
  const buffer = Buffer.alloc(arrayBuffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}

export const arrayBufferToBase64 = buffer => {
  var binary = '';
  var bytes = [].slice.call(new Uint8Array(buffer));
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
};

const queueFetchPromise = Promise.resolve();

export const queueFetch = function (url, options) {
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
