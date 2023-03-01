/**
 * @format
 */
import 'react-native-get-random-values';
import {polyfillGlobal} from 'react-native/Libraries/Utilities/PolyfillFunctions';

import 'react-native-url-polyfill/auto';
// import 'react-native-filereader';

// if (typeof BigInt === 'undefined') global.BigInt = require('big-integer');

// window.Buffer = window.Buffer || require('buffer').Buffer;

// polyfillGlobal('Buffer', () => require('buffer').Buffer);
// polyfillGlobal('SharedArrayBuffer', () => SharedArrayBuffer.prototype);
// polyfillGlobal('URL', () => require('whatwg-url').URL);

global.fetch = fetch;
global.Buffer = require('buffer').Buffer;
// global.FileReader = new (require('react-native-filereader'))();
// global.util = require('util');
// SharedArrayBuffer = ArrayBuffer;

const chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const atob = (input = '') => {
  let str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 == 1) {
    throw new Error(
      "'atob' failed: The string to be decoded is not correctly encoded.",
    );
  }
  for (
    let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
};

FileReader.prototype.readAsArrayBuffer = function (blob) {
  //   if (this.readyState === this.LOADING) throw new Error('InvalidStateError');
  //   this._setReadyState(this.LOADING);
  this._result = null;
  this._error = null;
  const fr = new FileReader();
  fr.onloadend = () => {
    const content = atob(
      fr.result.substr('data:application/octet-stream;base64,'.length),
    );
    const buffer = new ArrayBuffer(content.length);
    const view = new Uint8Array(buffer);
    view.set(Array.from(content).map(c => c.charCodeAt(0)));
    this._result = buffer;
    // this._setReadyState(this.DONE);
  };
  fr.readAsDataURL(blob);
};

import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
