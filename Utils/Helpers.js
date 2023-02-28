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

    console.log('Response', blob);

    // response has a method called .blob() to get the blob file
    const blob = await response.blob();

    console.log('BLOB IS', blob);

    // instantiate a file reader
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
