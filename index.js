/**
 * @format
 */
import 'react-native-get-random-values';
import {polyfillGlobal} from 'react-native/Libraries/Utilities/PolyfillFunctions';

import 'react-native-url-polyfill/auto';

// if (typeof BigInt === 'undefined') global.BigInt = require('big-integer');

// window.Buffer = window.Buffer || require('buffer').Buffer;

// polyfillGlobal('Buffer', () => require('buffer').Buffer);
// polyfillGlobal('SharedArrayBuffer', () => SharedArrayBuffer.prototype);
// polyfillGlobal('URL', () => require('whatwg-url').URL);

global.fetch = fetch;
// SharedArrayBuffer = ArrayBuffer;

import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
