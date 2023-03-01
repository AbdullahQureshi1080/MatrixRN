/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const E2E_PREFIX = 'crypto.';
const KEY_END_TO_END_ACCOUNT = E2E_PREFIX + 'account';
const KEY_CROSS_SIGNING_KEYS = E2E_PREFIX + 'cross_signing_keys';
const KEY_NOTIFIED_ERROR_DEVICES = E2E_PREFIX + 'notified_error_devices';
const KEY_DEVICE_DATA = E2E_PREFIX + 'device_data';
const KEY_INBOUND_SESSION_PREFIX = E2E_PREFIX + 'inboundgroupsessions/';
const KEY_INBOUND_SESSION_WITHHELD_PREFIX =
  E2E_PREFIX + 'inboundgroupsessions.withheld/';
const KEY_ROOMS_PREFIX = E2E_PREFIX + 'rooms/';
const KEY_SESSIONS_NEEDING_BACKUP = E2E_PREFIX + 'sessionsneedingbackup';
const KEY_OUTGOING_KEY_REQUEST = E2E_PREFIX + 'outgoingkeyrequest/';

// (0, _defineProperty2.default)(this, "outgoingRoomKeyRequests", []);
// (0, _defineProperty2.default)(this, "account", null);
// (0, _defineProperty2.default)(this, "crossSigningKeys", null);
// (0, _defineProperty2.default)(this, "privateKeys", {});
// (0, _defineProperty2.default)(this, "sessions", {});
// (0, _defineProperty2.default)(this, "sessionProblems", {});
// (0, _defineProperty2.default)(this, "notifiedErrorDevices", {});
// (0, _defineProperty2.default)(this, "inboundGroupSessions", {});
// (0, _defineProperty2.default)(this, "inboundGroupSessionsWithheld", {});
// (0, _defineProperty2.default)(this, "deviceData", null);
// (0, _defineProperty2.default)(this, "rooms", {});
// (0, _defineProperty2.default)(this, "sessionsNeedingBackup", {});
// (0, _defineProperty2.default)(this, "sharedHistoryInboundGroupSessions", {});
// (0, _defineProperty2.default)(this, "parkedSharedHistory", new Map());

function keyEndToEndSession(deviceKey, sessionKey) {
  return (
    E2E_PREFIX +
    'sessions/' +
    encodeURIComponent(deviceKey) +
    '/' +
    encodeURIComponent(sessionKey)
  );
}

function keyPrefixEndToEndSession(deviceKey) {
  return E2E_PREFIX + 'sessions/' + encodeURIComponent(deviceKey) + '/';
}

function keyEndToEndSessionProblems(deviceKey, sessionKey) {
  return (
    E2E_PREFIX +
    'session.problems/' +
    encodeURIComponent(deviceKey) +
    '/' +
    encodeURIComponent(sessionKey)
  );
}

function keyEndToEndInboundGroupSession(senderKey, sessionId) {
  return (
    KEY_INBOUND_SESSION_PREFIX +
    encodeURIComponent(senderKey) +
    '/' +
    encodeURIComponent(sessionId)
  );
}

function keyEndToEndInboundGroupSessionWithheld(senderKey, sessionId) {
  return (
    KEY_INBOUND_SESSION_WITHHELD_PREFIX +
    encodeURIComponent(senderKey) +
    '/' +
    encodeURIComponent(sessionId)
  );
}

function keyEndToEndRoomsPrefix(roomId) {
  return KEY_ROOMS_PREFIX + roomId;
}

function keyOutgoingKeyRequestPrefix(requestId) {
  return KEY_OUTGOING_KEY_REQUEST + requestId;
}

/*
 * Fake transaction class that mimics the behaviour of indexeddb in that it finishes once
 * all operations on that transaction have completed, ie. if the callback for an operation
 * exits and no more operations are scheduled the transaction is done.
 * This is necessary because the js-sdk crypto store API is based around indexeddb and
 * assumes that 'doTxn' will return once all these operations are complete, and the point
 * of doTxn is that it may do many individual operations.
 * The alternative is to change the js-sdk store API to allow for more async API. although
 * this risks introducing subtle bugs in the indexeddb store.
 */
class AsyncTxn {
  constructor() {
    this._opsInProgress = 0;
    this._resolveFunc = null;
    this._rejectFunc = null;
    this._error = null;
    this._prom = new Promise((resolve, reject) => {
      this._resolveFunc = resolve;
      this._rejectFunc = reject;
    });
  }

  getPromise() {
    return this._prom;
  }

  async wrap(f) {
    this._startOperation();
    try {
      await f();
    } catch (e) {
      this._error = e;
    } finally {
      this._finishOperation();
    }
  }

  _startOperation() {
    if (this._resolveFunc === null) {
      throw new Error(
        'Tried to start new operation on a finished transaction!',
      );
    }
    ++this._opsInProgress;
  }

  _finishOperation() {
    if (--this._opsInProgress === 0) {
      this._error ? this._rejectFunc(this._error) : this._resolveFunc();
      this._resolveFunc = null;
      this._rejectFunc = null;
    }
  }
}

/*
 * Crypto store for js-sdk using the react native async storage API.
 * The module providing the async storage API is passed in to allow it
 * to be swapped out, eg. for unit tests.
 */
class AsyncCryptoStore {
  constructor(asyncStorageClass) {
    this.asyncStorage = asyncStorageClass;
  }

  startup() {}

  doTxn(mode, stores, func) {
    const txn = new AsyncTxn();
    func(txn);
    return txn.getPromise();
  }

  // Olm Sessions

  countEndToEndSessions(txn, func) {
    txn.wrap(async () => {
      const allKeys = await this.asyncStorage.getAllKeys();

      const count = allKeys.filter(k =>
        k.startsWith(E2E_PREFIX + 'sessions/'),
      ).length;
      func(count);
    });
  }

  getEndToEndSession(deviceKey, sessionId, txn, func) {
    txn.wrap(async () => {
      const session = await this._getJsonItem(
        keyEndToEndSession(deviceKey, sessionId),
      );
      func(session);
    });
  }

  getEndToEndSessions(deviceKey, txn, func) {
    txn.wrap(async () => {
      const allKeys = await this.asyncStorage.getAllKeys();
      const sessions = {};
      for (const k of allKeys.filter(k =>
        k.startsWith(keyPrefixEndToEndSession(deviceKey)),
      )) {
        const sessionId = decodeURIComponent(k.split('/')[2]);
        sessions[sessionId] = await this._getJsonItem(
          keyEndToEndSession(deviceKey, sessionId),
        );
      }

      func(sessions);
    });
  }

  getAllEndToEndSessions(txn, func) {
    txn.wrap(async () => {
      const allKeys = this.asyncStorage.getAllKeys();
      for (const k of allKeys.filter(x =>
        x.startsWith(E2E_PREFIX + 'sessions/'),
      )) {
        const deviceKey = k.split('/')[1];
        const sessionId = k.split('/')[2];
        const sessionInfo = await this._getJsonItem(
          keyEndToEndSession(deviceKey, sessionId),
        );
        func(sessionInfo);
      }
      func(null);
    });
  }

  storeEndToEndSession(deviceKey, sessionId, sessionInfo, txn) {
    txn.wrap(() => {
      return this._setJsonItem(keyEndToEndSession(deviceKey, sessionId), {
        deviceKey,
        sessionId,
        session: sessionInfo.session,
        lastReceivedMessageTs: sessionInfo.lastReceivedMessageTs,
      });
    });
  }

  async storeEndToEndSessionProblem(deviceKey, type, fixed) {
    const key = keyEndToEndSessionProblems(deviceKey);
    const problems = (await this._getJsonItem(key)) || [];
    problems.push({type, fixed, time: Date.now()});
    problems.sort((a, b) => {
      return a.time - b.time;
    });
    await this._setJsonItem(key, problems);
  }

  async getEndToEndSessionProblem(deviceKey, timestamp) {
    const key = keyEndToEndSessionProblems(deviceKey);
    const problems = (await this._getJsonItem(key)) || [];
    if (!problems.length) {
      return null;
    }
    const lastProblem = problems[problems.length - 1];
    for (const problem of problems) {
      if (problem.time > timestamp) {
        return Object.assign({}, problem, {fixed: lastProblem.fixed});
      }
    }
    if (lastProblem.fixed) {
      return null;
    } else {
      return lastProblem;
    }
  }

  async filterOutNotifiedErrorDevices(devices) {
    const notifiedErrorDevices =
      (await this._getJsonItem(KEY_NOTIFIED_ERROR_DEVICES)) || {};
    const ret = [];

    for (const device of devices) {
      const {userId, deviceInfo} = device;
      if (userId in notifiedErrorDevices) {
        if (!(deviceInfo.deviceId in notifiedErrorDevices[userId])) {
          ret.push(device);
          notifiedErrorDevices[userId][deviceInfo.deviceId] = true;
        }
      } else {
        ret.push(device);
        notifiedErrorDevices[userId] = {[deviceInfo.deviceId]: true};
      }
    }

    await this._setJsonItem(KEY_NOTIFIED_ERROR_DEVICES, notifiedErrorDevices);

    return ret;
  }

  // Inbound Group Sessions

  getEndToEndInboundGroupSession(senderCurve25519Key, sessionId, txn, func) {
    txn.wrap(async () => {
      func(
        await this._getJsonItem(
          keyEndToEndInboundGroupSession(senderCurve25519Key, sessionId),
        ),
        await this._getJsonItem(
          keyEndToEndInboundGroupSessionWithheld(
            senderCurve25519Key,
            sessionId,
          ),
        ),
      );
    });
  }

  getAllEndToEndInboundGroupSessions(txn, func) {
    txn.wrap(async () => {
      const inboundGroupSessionKeys = (
        await this.asyncStorage.getAllKeys()
      ).filter(k => k.startsWith(KEY_INBOUND_SESSION_PREFIX));

      for (const k of inboundGroupSessionKeys) {
        const keyParts = k.split('/');
        const senderKey = decodeURIComponent(keyParts[1]);
        const sessionId = decodeURIComponent(keyParts[2]);

        const sessionData = await this._getJsonItem(k);
        func({
          senderKey,
          sessionId,
          sessionData,
        });
      }
      func(null);
    });
  }

  addEndToEndInboundGroupSession(
    senderCurve25519Key,
    sessionId,
    sessionData,
    txn,
  ) {
    txn.wrap(async () => {
      const existing = await this._getJsonItem(
        keyEndToEndInboundGroupSession(senderCurve25519Key, sessionId),
      );
      if (!existing) {
        await this.storeEndToEndInboundGroupSession(
          senderCurve25519Key,
          sessionId,
          sessionData,
          txn,
        );
      }
    });
  }

  storeEndToEndInboundGroupSession(
    senderCurve25519Key,
    sessionId,
    sessionData,
    txn,
  ) {
    txn.wrap(() => {
      return this._setJsonItem(
        keyEndToEndInboundGroupSession(senderCurve25519Key, sessionId),
        sessionData,
      );
    });
  }

  storeEndToEndInboundGroupSessionWithheld(
    senderCurve25519Key,
    sessionId,
    sessionData,
    txn,
  ) {
    txn.wrap(() => {
      return this._setJsonItem(
        keyEndToEndInboundGroupSessionWithheld(senderCurve25519Key, sessionId),
        sessionData,
      );
    });
  }

  // Device data

  getEndToEndDeviceData(txn, func) {
    txn.wrap(async () => {
      func(await this._getJsonItem(KEY_DEVICE_DATA));
    });
  }

  storeEndToEndDeviceData(deviceData, txn) {
    txn.wrap(() => {
      return this._setJsonItem(KEY_DEVICE_DATA, deviceData);
    });
  }

  // Rooms

  storeEndToEndRoom(roomId, roomInfo, txn) {
    txn.wrap(() => {
      return this._setJsonItem(keyEndToEndRoomsPrefix(roomId), roomInfo);
    });
  }

  getEndToEndRooms(txn, func) {
    txn.wrap(async () => {
      const prefix = keyEndToEndRoomsPrefix('');

      const e2eRoomsKeys = (await this.asyncStorage.getAllKeys()).filter(k =>
        k.startsWith(prefix),
      );

      const result = {};
      for (const k of e2eRoomsKeys) {
        const roomId = k.substr(prefix.length);
        result[roomId] = await this._getJsonItem(k);
      }
      func(result);
    });
  }

  // Sessions Needing Backup

  async getSessionsNeedingBackup(limit) {
    const sessionsNeedingBackup =
      (await this._getJsonItem(KEY_SESSIONS_NEEDING_BACKUP)) || {};
    const sessions = [];

    for (const k of Object.keys(sessionsNeedingBackup)) {
      const keyParts = k.split('/');
      const senderKey = keyParts[0];
      const sessionId = keyParts[1];

      const sessionData = await this._getJsonItem(
        keyEndToEndInboundGroupSession(senderKey, sessionId),
      );
      sessions.push({
        senderKey: senderKey,
        sessionId: sessionId,
        sessionData: sessionData,
      });

      if (limit && sessions.length >= limit) {
        break;
      }
    }
    return sessions;
  }

  async countSessionsNeedingBackup() {
    const sessionsNeedingBackup =
      (await this._getJsonItem(KEY_SESSIONS_NEEDING_BACKUP)) || {};
    return Object.keys(sessionsNeedingBackup).length;
  }

  async unmarkSessionsNeedingBackup(sessions) {
    const sessionsNeedingBackup =
      (await this._getJsonItem(KEY_SESSIONS_NEEDING_BACKUP)) || {};
    for (const session of sessions) {
      delete sessionsNeedingBackup[session.senderKey + '/' + session.sessionId];
    }
    await this._setJsonItem(KEY_SESSIONS_NEEDING_BACKUP, sessionsNeedingBackup);
  }

  async markSessionsNeedingBackup(sessions) {
    const sessionsNeedingBackup =
      (await this._getJsonItem(KEY_SESSIONS_NEEDING_BACKUP)) || {};
    for (const session of sessions) {
      sessionsNeedingBackup[session.senderKey + '/' + session.sessionId] = true;
    }
    await this._setJsonItem(KEY_SESSIONS_NEEDING_BACKUP, sessionsNeedingBackup);
  }

  /**
   * Delete all data from this store.
   *
   * @returns {Promise} Promise which resolves when the store has been cleared.
   */
  async deleteAllData() {
    const allE2eStorageKeys = (await this.asyncStorage.getAllKeys()).filter(k =>
      k.startsWith(E2E_PREFIX),
    );

    for (const k of allE2eStorageKeys) {
      await this.asyncStorage.removeItem(k);
    }
  }

  // Olm account

  getAccount(txn, func) {
    txn.wrap(async () => {
      const account = await this._getJsonItem(KEY_END_TO_END_ACCOUNT);
      func(account);
    });
  }

  storeAccount(txn, newData) {
    txn.wrap(() => {
      return this._setJsonItem(KEY_END_TO_END_ACCOUNT, newData);
    });
  }

  getCrossSigningKeys(txn, func) {
    txn.wrap(async () => {
      const keys = await this._getJsonItem(KEY_CROSS_SIGNING_KEYS);
      func(keys);
    });
  }

  getSecretStorePrivateKey(txn, func, type) {
    txn.wrap(async () => {
      const key = await this._getJsonItem(E2E_PREFIX + `ssss_cache.${type}`);
      func(key);
    });
  }

  storeCrossSigningKeys(txn, keys) {
    txn.wrap(() => {
      return this._setJsonItem(KEY_CROSS_SIGNING_KEYS, keys);
    });
  }

  storeSecretStorePrivateKey(txn, type, key) {
    txn.wrap(() => {
      return this._setJsonItem(E2E_PREFIX + `ssss_cache.${type}`, key);
    });
  }

  // Outgoing key requests
  async getOrAddOutgoingRoomKeyRequest(request) {
    const req = await this.getOutgoingRoomKeyRequest(request.requestBody);
    if (req) {
      return req;
    }
    await this._setJsonItem(
      keyOutgoingKeyRequestPrefix(request.requestId),
      request,
    );
  }

  async getOutgoingRoomKeyRequest(requestBody) {
    const allRequestIds = await this._allOutgoingKeyRequestKeys();
    for (const reqId of allRequestIds) {
      const req = await this._getJsonItem(reqId);
      if (
        req.requestBody.room_id === requestBody.room_id &&
        req.requestBody.session_id === requestBody.session_id
      ) {
        return req;
      }
    }
    return null;
  }

  async getOutgoingRoomKeyRequestByState(wantedStates) {
    const allRequestIds = await this._allOutgoingKeyRequestKeys();
    for (const reqId of allRequestIds) {
      const req = await this._getJsonItem(reqId);
      if (wantedStates.includes(req.state)) {
        return req;
      }
    }
    return null;
  }

  async getAllOutgoingRoomKeyRequestsByState(wantedStates) {
    const reqs = [];

    const allRequestIds = await this._allOutgoingKeyRequestKeys();
    for (const reqId of allRequestIds) {
      const req = await this._getJsonItem(reqId);
      if (wantedStates.includes(req.state)) {
        reqs.push(req);
      }
    }
    return reqs;
  }

  async getOutgoingRoomKeyRequestsByTarget(userId, deviceId, wantedStates) {
    const reqs = [];

    const allRequestIds = await this._allOutgoingKeyRequestKeys();
    for (const reqId of allRequestIds) {
      const req = await this._getJsonItem(reqId);
      if (
        req.recipients.includes({userId, deviceId}) &&
        wantedStates.includes(req.state)
      ) {
        reqs.push(req);
      }
    }
    return reqs;
  }

  async updateOutgoingRoomKeyRequest(requestId, expectedState, updates) {
    const storeKey = keyOutgoingKeyRequestPrefix(requestId);

    const req = await this._getJsonItem(storeKey);
    if (!req || req.state !== expectedState) {
      return;
    }

    Object.assign(req, updates);
    await this._setJsonItem(storeKey, req);
  }

  async deleteOutgoingRoomKeyRequest(requestId, expectedState) {
    const storeKey = keyOutgoingKeyRequestPrefix(requestId);

    const req = await this._getJsonItem(storeKey);
    if (req.state !== expectedState) {
      return;
    }

    await this.asyncStorage.removeItem(storeKey);
  }

  async _allOutgoingKeyRequestKeys() {
    const allKeys = await this.asyncStorage.getAllKeys();
    return allKeys.filter(k => k.startsWith(KEY_OUTGOING_KEY_REQUEST));
  }

  async addSharedHistoryInboundGroupSession(roomId, senderKey, sessionId) {
    console.log(
      'addSharedHistoryInboundGroupSession',
      'ROOM ID',
      roomId,
      'SENDERKEY',
      senderKey,
      'SESSION ID',
      sessionId,
    );
    // const sessions = this.sharedHistoryInboundGroupSessions[roomId] || [];
    // sessions.push([senderKey, sessionId]);
    // this.sharedHistoryInboundGroupSessions[roomId] = sessions;
  }

  async getSharedHistoryInboundGroupSessions(roomId) {
    console.log('ROOM ID', roomId);
    // return Promise.resolve(
    //   this.sharedHistoryInboundGroupSessions[roomId] || [],
    // );
  }

  async _getJsonItem(key) {
    // if the key is absent, AsyncStore.getItem() returns null, and
    // JSON.parse(null) === null, so this returns null.
    return JSON.parse(await this.asyncStorage.getItem(key));
  }

  async _setJsonItem(key, val) {
    return this.asyncStorage.setItem(key, JSON.stringify(val));
  }
}

module.exports = AsyncCryptoStore;
