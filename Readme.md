## Installation & Setup

Since matrix-js-sdk is a web javascript project-package we need more than the package itself to make it work, with much R&D these packages were necessary to make SDK work.

`npm i matrix-js-sdk buffer events fbemitter unorm`

## Versioning

The package versions I have used and worked with are as follows but I think any versions of these packages will work and hopefully be backward compatible. But make sure to have the correct SDK version because the API reference can change in new versions.

```
matrix-js-sdk": "^12.0.0" || "matrix-js-sdk": "^19.3.0"
buffer": "^5.7.1"
events": "^3.3.0"
fbemitter": "^3.0.0"`"unorm": "^1.6.0"
```

## How to make it work with React Native

### Issues on Android

You might run into build issues when you build the app after installing these packages, especially on android, this error can be can't find variable Intl, something of this like. To resolve this error you can update the following line root/android/app/build.gradle, hopefully with this the build issue will be resolved.

```
// def jscFlavor = 'org.webkit:android-jsc:+' // comment this
def jscFlavor = 'org.webkit:android-jsc-intl:+' //Add this
```

### Prerequisite

The packages are installed and you’d think you’re good but wait there are a few more kicks to make things work. As we use a web based project in a non node environment we need some polyfills that are internally used by SDK. We found a file mentioned as a github gist that helped us.

```
import { EventEmitter } from 'fbemitter';
import unorm from 'unorm';

String.prototype.normalize = function (form) {
return require('unorm')[String(form).toLowerCase()](this);
};

export default class Document {
constructor() {
    this.emitter = new EventEmitter();
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.\_checkEmitter = this.\_checkEmitter.bind(this);
}

createElement(tagName) {
    return {};
}

\_checkEmitter() {
    if (
    !this.emitter ||
    !(
        this.emitter.on ||
        this.emitter.addEventListener ||
        this.emitter.addListener
    )
    ) {
        this.emitter = new EventEmitter();
    }
}

addEventListener(eventName, listener) {
    this.\_checkEmitter();
    if (this.emitter.on) {
         this.emitter.on(eventName, listener);
    } else if (this.emitter.addEventListener) {
         this.emitter.addEventListener(eventName, listener);
    } else if (this.emitter.addListener) {
         this.emitter.addListener(eventName, listener);
    }
}

removeEventListener(eventName, listener) {
    this.\_checkEmitter();
    if (this.emitter.off) {
         this.emitter.off(eventName, listener);
    } else if (this.emitter.removeEventListener) {
         this.emitter.removeEventListener(eventName, listener);
    } else if (this.emitter.removeListener) {
         this.emitter.removeListener(eventName, listener);
    }
}
}

// console.log('The Window document', new Document());
window.document = window.document || new Document();


```

You can create a new file named Polyfill.js or any other name you’d like and import the file in your matrix service file or where you have initialized the matrix-js-sdk.

### Client Options & Initializing Client

```
const MATRIX_CLIENT_START_OPTIONS = {
    initialSyncLimit: 10,
    lazyLoadMembers: true,
    pendingEventOrdering: 'detached',
    timelineSupport: true,
    unstableClientRelationAggregation: true,
};

```

To initialize a matrix client you need to have a server url (host), this can be https://matrix-client.matrix.org or any hosted server initialized as a synapse server on which matrix-js -sdk works with.

#### Existing User

If a user exists on matrix home server than we initialize the client as following

```
async createClient(matrixCredentials) {
    const client = sdk.createClient({
    baseUrl: this.host,
    accessToken: matrixCredentials.accessToken,
    userId: matrixCredentials.userId,
    deviceId: matrixCredentials.deviceId,
    ...MATRIX_CLIENT_START_OPTIONS,
});
let clientSyncPromise = null;
await client.startClient({initialSyncLimit: 10});
clientSyncPromise = new Promise((resolve, reject) => {
client.once('sync', function (state, prevState, res) {
console.log('client sync state: ', state, prevState, res);
if (state === 'PREPARED') {
    resolve();
} else {
    reject(new Error(`State not prepared, instead: ${state}`));
}
});
});
await clientSyncPromise;
return client;
}

```

#### New User

For a new user we can just create a client with host url and the matrix client options. After the user logins in then update the client using the above snippet.

```
let client = sdk.createClient({
baseUrl: this.host,
...MATRIX_CLIENT_START_OPTIONS,
});

```

#### Testing

##### Two Clients

Two matrix clients in the same room chat, two app instances logged with a different account.
Client with Element
Create account on element with a home server (this can be matrix server or ay hosted synapses server)
Create a room, add members
Chat, Log on to the element on the same home server as the client and if there is a room present in which you are added you can start chatting.

##### Element with Element

Create account on element with a home server
Create a room, add members
Chat, Log on to the another element client on the same home server as the client and if there is a room present in which you are added you can start chatting.

## Documentation Guides

### Matrix Client API Docs Github Version

This is the Matrix Client-Server r0 SDK for JavaScript. http://matrix-org.github.io/matrix-js-sdk/19.3.0/

### Matrix Spec Documentation

#### Unstable

https://spec.matrix.org/unstable/

#### Stable - Latest

https://spec.matrix.org/latest/

#### Matrix Js API Playground

https://matrix.org/docs/api/#overview

## Note

This is a simple example project to get you started, this is an abstraction of an overall use case, can be improved and can be made more simpler in terms of code readability. While this is a simple example it contains some of the advanced features from matrix such as read receipts and end to end encryption, while it is work in progress and e2e encryption is not fully functional, the simple chat use case is complete. You can comment out anything related to olm, crypto, or memory store to disable e2e encryption if you do not need it, but this should not affect the simple use - case.

### Side Note:

Any sort of PR, contribution or help on making this example better or completing the use case of e2e encryption is welcomed and would be really helpful.
