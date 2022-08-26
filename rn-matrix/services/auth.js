import { BehaviorSubject } from 'rxjs';

import i18n from '../utilities/i18n';
import matrix from './matrix';
import storage from './storage';

const debug = require('debug')('rnm:services:auth');

const initialAuthData = {
  userId: null,
  accessToken: null,
  homeserver: null,
  deviceId: null,
  crypto: false,
};

class AuthService {
  _data$;
  _isLoaded$;
  _isLoggedIn$;
  _isSyncing;

  constructor() {
    this._data$ = new BehaviorSubject(initialAuthData);
    this._isLoggedIn$ = new BehaviorSubject(false);
    this._isLoaded$ = new BehaviorSubject(false);
    this._isSyncing = false;
  }

  async init() {
    this._isSyncing = true;
    const jsonData = await storage.getItem('@rnm-auth');
    const cleanData = this._sanitizeData(jsonData);
    this._isLoggedIn$.next(this._isLoggedIn(cleanData));
    this._data$.next(cleanData);
    this._isLoaded$.next(true);
    this._isSyncing = false;

    // We can be logged out of the session because of password reset for example
    matrix.isReady$().subscribe((isReady) => {
      if (isReady) {
        matrix.getClient().on('Session.logged_out', (e) => {
          // TODO warn the user why this happens
          debug('Logged out from the client', e);
          this.logout();
        });
      }
    });

    this.loginWithStoredCredentials();
  }

  // ********************************************************************************
  // Data
  // ********************************************************************************
  getUserId() {
    return this._data$.getValue().userId;
  }

  isLoaded$() {
    return this._isLoaded$;
  }

  isLoggedIn$() {
    return this._isLoggedIn$;
  }

  async _setData(data) {
    if (this._isSyncing) debug('A storage interaction is already running');
    this._isSyncing = true;
    const cleanData = this._sanitizeData(data);
    this._data$.next(cleanData);
    await storage.setItem('@rnm-auth', cleanData);
    this._isSyncing = false;
  }

  async _reset() {
    await this._setData(initialAuthData);
  }

  _isLoggedIn(data) {
    return data && data.userId && data.accessToken && data.homeserver ? true : false;
  }

  _sanitizeData(data) {
    return {
      userId: data?.userId,
      accessToken: data?.accessToken,
      homeserver: data?.homeserver,
      deviceId: data?.deviceId,
      crypto: data?.crypto,
    };
  }

  // ********************************************************************************
  // Actions
  // ********************************************************************************
  async loginWithPassword(username, password, homeserver, initCrypto = false) {
    try {
      let user = username;
      let domain = homeserver;
      if (!domain || domain.length === 0) {
        const splitUser = user.split(':');
        if (splitUser.length === 2) {
          user = splitUser[0].slice(1);
          domain = splitUser[1];
        } else if (splitUser.length > 2) {
          return {
            error: 'INVALID_USERNAME',
            message: i18n.t('auth:login.invalidUsernameError'),
          };
        } else domain = 'matrix.org';
      }

      domain = domain.includes('https://') ? domain : `https://${domain}`;
      debug('hey domain ', domain);

      const domainToCheck = domain.slice(8);
      const homeserverData = await matrix.getHomeserverData(domainToCheck);
      debug('homeserver data ', homeserverData);

      debug('Logging in as %s on %s', user, homeserverData.baseUrl || domain);
      const client = await matrix.createClient(homeserverData.baseUrl || domain);
      debug('Logging in to created client...', client);
      const response = await client.loginWithPassword(user, password);
      debug('Logging in again with device ID... ', JSON.stringify(response));
      await matrix.createClient(
        homeserverData.baseUrl || domain,
        response.access_token,
        response.user_id,
        response.device_id
      );

      this._isLoggedIn$.next(true);

      matrix.start(initCrypto);

      const data = {
        userId: response.user_id,
        accessToken: response.access_token,
        homeserver: homeserverData.baseUrl || domain,
        deviceId: response.device_id,
        crypto: initCrypto,
      };
      await this._setData(data);

      return data;
    } catch (e) {
      debug('Error logging in:', e);
      const data = {};
      if (e.errcode) {
        // Matrix errors
        data.error = e.errcode;
        switch (e.errcode) {
          case 'M_FORBIDDEN':
            data.message = i18n.t('auth:login.forbiddenError');
            break;
          case 'M_USER_DEACTIVATED':
            data.message = i18n.t('auth:login.userDeactivatedError');
            break;
          case 'M_LIMIT_EXCEEDED':
            data.message = i18n.t('auth:login.limitExceededError');
            break;
          default:
            data.message = i18n.t('auth:login.unknownError');
        }
      } else {
        // Connection error
        // TODO: test internet connection
        data.error = 'NO_RESPONSE';
        data.message = i18n.t('auth:login.noResponseError');
      }
      return data;
    }
  }

  async loginWithStoredCredentials() {
    try {
      const { homeserver, userId, accessToken, deviceId, crypto } = this._data$.getValue();
      if (!homeserver || !userId || !accessToken) {
        return {
          error: 'NO_STORED_CREDENTIALS',
          message: i18n.t('auth:login.noStoredCredentialsError'),
        };
      }
      debug('Logging in as %s on %s with deviceId %s', userId, homeserver, deviceId);
      await matrix.createClient(homeserver, accessToken, userId, deviceId);

      this._isLoggedIn$.next(true);

      matrix.start(crypto);

      return {
        homeserver,
        userId,
        accessToken,
      };
    } catch (e) {
      debug('Error logging in:', e);
      const login = {};
      if (e.errcode) {
        login.error = e.errcode;
        switch (e.errcode) {
          case 'M_UNKNOWN_TOKEN':
            login.message = i18n.t('auth:login.unknownTokenError');
            matrix.stop();
            break;
          default:
            login.message = i18n.t('auth:login.unknownError');
        }
      } else {
        login.error = 'NO_ERRCODE';
        login.message = i18n.t('auth:login.noResponseError');
      }
      return login;
    }
  }

  async logout() {
    try {
      await this._reset();
      await matrix.stop();
      // TODO: Maybe keep some settings
      await storage.clear();
      this._isLoggedIn$.next(false);
    } catch (e) {
      debug('Error logging out', e);
    }
  }
}

const authService = new AuthService();
export default authService;
