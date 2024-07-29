const APP_STORE_KEY = '2fauth-app-settings',
  ENC_STORE_KEY = '2fauth-enc-details',
  STATE_STORE_KEY = '2fauth-state',
  decoder = new TextDecoder(),
  encoder = new TextEncoder(),
  _browser = (typeof browser === "undefined") ? chrome : browser,
  _crypto = (typeof window === "undefined") ? crypto : window.crypto,
  enc_key = null,
  default_state = {
    loaded: false,
    locked: true,
    last_active: null,
    lock_type: false,
    pat: ''
  };

let ext_client,
    enc_details = {
      default: true,
      salt: null,
      iv: null
    },
    state = {...default_state};

_browser.windows.onRemoved.addListener(handleBrowserClosed);
_browser.runtime.onStartup.addListener(handleStartup);
_browser.runtime.onInstalled.addListener(handleUpdates);
_browser.runtime.onSuspend.addListener(handleClose);
_browser.runtime.onMessage.addListener(handleMessages);
_browser.alarms.onAlarm.addListener(handleAlarms);
_browser.idle.onStateChanged.addListener(handleSystemStateChange)
_browser.runtime.onConnect.addListener(handleOnConnect);

/**
 * Detect all browser windows closing and lock extension if required
 *
 * TODO: Needs testing without dev-tools windows open to see if it still triggers ( hint: it doesn't seem to :/ )
 */
function handleBrowserClosed(window_id) {
  _browser.windows.getAll().then(window_list => {
    if (window_list.length === 0) {
      if (state.lock_type !== null) {
        lockNow();
      } else {
        storeState();
      }
    }
  });
}

/**
 * Listen for messages from the extension
 */
function handleMessages(message, sender, response) {
  const message_type = message.type ? message.type : undefined;
  switch (message_type) {
    case 'GET-PAT':
      getPat().then(data => response(data));
      break;
    case 'CHECK-LOCKED':
      isLocked().then(data => response(data));
      break;
    case 'SET-ENC-KEY':
      setEncKey(message.payload).then(data => response(data));
      break;
    case 'CHANGE-ENC-KEY':
      changeEncKey(message.payload).then(data => response(data));
      break;
    case 'UNLOCK-EXT':
      unlockExt().then(data => response(data));
      break;
    case 'ENCRYPT-PAT':
      encryptPat(message.payload).then(data => response(data));
      break;
    case 'SET-LOCK-TYPE':
      setLockType(message.payload).then(data => response(data));
      break;
    case 'RESET-EXT':
      resetExt().then(data => response(data));
      break;
  }

  return true;
}

/**
 * Handle the lock timeout alarm
 */
function handleAlarms(alarm) {
  if (alarm.name === 'lock-extension') {
    if (state.loaded) {
      lockNow();
    } else {
      loadState().then(() => {
        lockNow();
      });
    }
  }
}

/**
 * Handle the extension connecting/disconnecting
 */
function handleOnConnect(externalPort) {
  if (state.loaded === false) {
    handleStartup();
  }
  externalPort.onDisconnect.addListener(handleClose);
}

/**
 * Detect the system state change
 */
function handleSystemStateChange(new_state) {
  function checkLockState() {
    if (state.lock_type !== null && state.lock_type !== -1) {
      lockNow();
    }
  }

  if (new_state === 'locked') {
    if (state.loaded) {
      checkLockState();
    } else {
      loadState().then(() => {
        checkLockState();
      });
    }
  }
}

/**
 * Handle startup tasks
 */
function handleStartup() {
  loadState().then(() => {
    if (state.lock_type !== null) {
      lockNow();
    }
  });
}

/**
 * Handle update tasks
 */
async function handleUpdates(details) {
  if (details.reason === 'update') {
    const prev_version = parseInt(details.previousVersion.replace('.', ''));
    if (prev_version === 202450) {
      // Remove the now unused '2fauth-enc-key' storage item.
      console.log("Removing old 2fauth-enc-key stored value...");
      await _browser.storage.local.remove('2fauth-enc-key');
    }
  }
  handleStartup();
}

/**
 * Handle close events
 */
function handleClose() {
  storeState().then(() => {
    setLockTimer()
  });
}

/**
 * Save the workers state in storage
 *
 * @param update_active
 * @returns {Promise<boolean>}
 */
function storeState(update_active = true) {
  if (update_active) {
    state.last_active = Date.now();
  }
  return _browser.storage.local.set({[STATE_STORE_KEY]: state}).then(() => true, () => false);
}

/**
 * Load the workers state from storage or populate default values
 *
 * @returns {Promise<{[p: string]: any} | *>}
 */
function loadState() {
  /**
   * Check if the current state warrants manually locking
   */
  function _checkLock() {
    if (state.lock_type > 0 && state.last_active !== null && ((Date.now() - state.last_active) / 60000) > state.lock_type) {
      state.pat = '';
      state.locked = true;
    }
  }

  return _browser.storage.local.get({[STATE_STORE_KEY]: null}).then(
    state_data => {
      state = state_data[STATE_STORE_KEY];
      if (state !== null) {
        state.loaded = true;
        if (state.lock_type === false) {
          // This code should not be possible to run but something is causing the lock_type to reset to its default state sometimes.
          return _browser.storage.local.get({[APP_STORE_KEY]: null}).then(settings => {
            settings = settings[APP_STORE_KEY];
            if (settings !== null) {
              state.lock_type = settings.lock_timeout;
            }
            _checkLock();
            return true;
          }, () => false)
        } else {
          _checkLock();
          return true;
        }
      } else {
        return loadDefaultState();
      }
    },
    () => {
      return loadDefaultState();
    }
  );
}

/**
 * Populate the workers state with default values
 *
 * @returns {Promise<boolean>}
 */
function loadDefaultState() {
  state = {...default_state};
  state.lock_type = null;
  return _browser.storage.local.get({[APP_STORE_KEY]: null}).then(settings => {
    settings = settings[APP_STORE_KEY];
    if (settings !== null) {
      state.lock_type = (settings.lock_timeout !== null && settings.lock_timeout !== 'null') ? parseInt(settings.lock_timeout) : null;
      if (state.lock_type !== null) {
        state.locked = true;
      }
    }
    return storeState(false).then(() => {
      return false;
    });
  }, () => {
    return storeState(false).then(() => {
      return false;
    })
  });
}

/**
 * Lock the extension
 */
function lockNow() {
  state.locked = true;
  state.pat = '';
  storeState().then(() => {
    // Clear the encryption key
    this.enc_key = null;
    // Clear the alarm so it doesn't fire again
    _browser.alarms.clear('lock-extension');
  })
}

/**
 * Enable the lock timer
 */
function setLockTimer() {
  if (state.lock_type !== null && state.lock_type !== 'null') {
    const lock_type = parseInt(state.lock_type);
    if (lock_type > 0) {
      _browser.alarms.create('lock-extension', {delayInMinutes: lock_type});
    } else if (lock_type === 0) {
      lockNow();
    }
  }
}

/**
 * Get the Personal Access Token
 *
 * @returns {Promise<Awaited<{pat: string, status: boolean}>>}
 */
function getPat() {
  return Promise.resolve({status: true, pat: state.pat});
}

/**
 * Check if the extension is currently or should be locked
 *
 * @returns {Promise<{[p: string]: any} | {locked: boolean}>}
 */
function isLocked() {
  // This is triggered each time the extension loads, so we will use it as a point to load/generate the salt and iv for encryption
  return loadState().then(() => {
    return _browser.storage.local.get({[ENC_STORE_KEY]: null}).then(details => {
      if (details && details.hasOwnProperty(ENC_STORE_KEY) && details[ENC_STORE_KEY]) {
        enc_details.iv = new Uint8Array(details[ENC_STORE_KEY].iv);
        enc_details.salt = new Uint8Array(details[ENC_STORE_KEY].salt);
        enc_details.default = details[ENC_STORE_KEY].default ?? true;
        return new Promise(resolve => resolve())
      } else {
        enc_details.iv = _crypto.getRandomValues(new Uint8Array(12));
        enc_details.salt = _crypto.getRandomValues(new Uint8Array(16));
        enc_details.default = true;
        // Store the generated salt + iv (the iv is re-generated every time the pat is encrypted)
        return _browser.storage.local.set({
          [ENC_STORE_KEY]: {
            iv: Array(...new Uint8Array(enc_details.iv)), salt: Array(...new Uint8Array(enc_details.salt)), default: enc_details.default
          }
        });
      }
    }, () => new Promise(resolve => resolve()));
  }).then(() => {
    return _browser.storage.local.get({[APP_STORE_KEY]: {}}).then(settings => {
      let return_value = {locked: false};

      // The extension can only be locked if there is a PAT present in the settings and the user has set a password
      if (settings.hasOwnProperty(APP_STORE_KEY) && settings[APP_STORE_KEY].hasOwnProperty('host_pat')) {
        return_value.locked = settings[APP_STORE_KEY]['host_pat'].length > 0 && state.locked === true;
      }
      // If the user has not set a password and locked is true, unlock the PAT using a null key
      if (return_value.locked === true && enc_details.default === true) {
        return unlockExt().then(status => {
          return_value.locked = false;
          return return_value;
        })
      } else {
        return return_value;
      }
    }, () => {
      return {locked: false};
    });
  });
}

/**
 * Reset the extension
 *
 * @returns {Promise<unknown>}
 */
function resetExt() {
  enc_details = {
    salt: null, iv: null, default: true
  };
  state.locked = false;
  state.lock_type = null;
  state.pat = '';

  return new Promise(resolve => resolve());
}

/**
 * Attempt to unlock the extension
 *
 * @returns {Promise<{[p: string]: any} | {status: boolean}>}
 */
function unlockExt() {
  return _browser.storage.local.get({[APP_STORE_KEY]: {}}).then(settings => {
    if (!settings || settings.hasOwnProperty(APP_STORE_KEY) === false) {
      return {status: true};
    }
    state.pat = settings[APP_STORE_KEY]['host_pat'] || '';
    return getEncKey().then(key_to_use => {
      return deriveKey(key_to_use, enc_details.salt).then(enc_key => {
        return decryptPat(state.pat, enc_key).then(clear_text => {
          if (clear_text !== 'decryption error') {
            state.pat = clear_text;
            state.locked = false;
            return _browser.alarms.clear('lock-extension').then(() => {
              return {status: true}
            }, () => {
              return {status: true}
            });
          } else {
            return {status: false};
          }
        }, () => {
          return {status: false}
        });
      }, () => {
        return {status: false}
      });
    }, () => {
      return {status: false}
    });
  }, () => {
    return {status: false}
  });
}

/**
 * Set the encryption key to be used by unlockExt
 *
 * @param key
 * @returns {Promise<{status: boolean}>}
 */
function setEncKey(key) {
  this.enc_key = key;
  return Promise.resolve({status: true});
}

/**
 * Get the currently stored encryption key
 *
 * @returns {Promise<{[p: string]: any}>}
 */
function getEncKey() {
  return Promise.resolve(this.enc_key);
}

/**
 * Set a new encryption key and re-encrypt PAT using the new key
 *
 * @param key
 * @returns {Promise<* | {host_pat: null, status: boolean}>}
 */
function changeEncKey(key) {
  return this.setEncKey(key).then(() => this.encryptPat(state.pat), () => {
    return {status: false, host_pat: null}
  });
}

/**
 * Decrypt the PAT using the currently stored key
 *
 * @param cipher_text
 * @param enc_key
 * @returns {Promise<Awaited<string>>|Promise<T | string>}
 */
function decryptPat(cipher_text, enc_key) {
  const failed_promise = Promise.resolve('decryption error');
  if (enc_key && cipher_text) {
    try {
      return _crypto.subtle.decrypt({
        name: "AES-GCM", iv: enc_details.iv
      }, enc_key, new Uint8Array(cipher_text)).then(decoded_buffer => {
        try {
          return decoder.decode(new Uint8Array(decoded_buffer));
        } catch (e) {
          return failed_promise
        }
      }, () => failed_promise);
    } catch (e) {
      return failed_promise
    }
  }

  return failed_promise
}

/**
 * Derive the encryption key from the users password
 *
 * @param key
 * @param salt
 * @returns {Promise<CryptoKey>}
 */
function deriveKey(key, salt) {
  return _crypto.subtle.importKey("raw", encoder.encode(key), "PBKDF2", false, ["deriveBits", "deriveKey"]).then(
    key_material => {
      return _crypto.subtle.deriveKey({
        name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256"
      }, key_material, {
        name: "AES-GCM", length: 256
      }, true, ["encrypt", "decrypt"]);
    }
  );
}

/**
 * Encrypt the PAT using the currently stored encryption key
 *
 * @param pat_clear
 * @returns {Promise<{[p: string]: any}>}
 */
function encryptPat(pat_clear) {
  try {
      return deriveKey(this.enc_key, enc_details.salt).then(enc_key => {
        enc_details.iv = _crypto.getRandomValues(new Uint8Array(12));
        enc_details.default = this.enc_key === null;
        return _browser.storage.local.set({
          [ENC_STORE_KEY]: {
            iv: Array(...new Uint8Array(enc_details.iv)), salt: Array(...new Uint8Array(enc_details.salt)), default: enc_details.default
          }
        }).then(() => {
          return _crypto.subtle.encrypt({
            name: "AES-GCM", iv: enc_details.iv
          }, enc_key, encoder.encode(pat_clear).buffer).then(ciphertext => {
            return {status: true, host_pat: Array(...new Uint8Array(ciphertext))}
          }, () => {
            return {status: false, host_pat: null};
          });
        });
      });
  } catch (e) {
    // Do nothing
  }
  return Promise.resolve({status: false, host_pat: null});
}

/**
 * Set the lock type
 *
 * @param new_lock_type
 * @returns {Promise<Awaited<{status: boolean}>>}
 */
function setLockType(new_lock_type) {
  state.lock_type = (new_lock_type !== null && new_lock_type !== 'null') ? parseInt(new_lock_type) : null;
  return Promise.resolve({status: true});
}
