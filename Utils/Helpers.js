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
