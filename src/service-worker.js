const APP_STORE_KEY= '2fauth-app-settings',
      KEY_STORE_KEY = '2fauth-enc-key',
      ENC_STORE_KEY= '2fauth-enc-details',
      STATE_STORE_KEY = '2fauth-state',
      decoder = new TextDecoder(),
      encoder = new TextEncoder()
      default_state = {
        loaded: false,
        locked: true,
        last_active: null,
        lock_type: null,
        pat: ''
      };

let ext_client,
  _browser = (typeof browser === "undefined") ? chrome : browser,
  _crypto = (typeof window === "undefined") ? crypto : window.crypto,
  enc_details = {
    default: true,
    salt: null,
    iv: null
  },
  state = {...default_state};

/**
 * Detect all browser windows closing and lock extension if required
 *
 * TODO: Needs testing without dev-tools windows open to see if it still triggers ( hint: it doesn't seem to :/ )
 */
_browser.windows.onRemoved.addListener(window_id => {
  _browser.windows.getAll().then(window_list => {
    if (window_list.length === 0) {
      if (state.lock_type !== null) {
        lockNow();
      } else {
        storeState();
      }
    }
  });
});

_browser.runtime.onStartup.addListener(handleStartup);
_browser.runtime.onInstalled.addListener(handleStartup);
_browser.runtime.onSuspend.addListener(handleClose);

_browser.runtime.onMessage.addListener((message, sender, response) => {
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
});

_browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'lock-extension') {
    lockNow();
  }
});

_browser.idle.onStateChanged.addListener(new_state => {
  if (new_state === 'locked' && state.lock_type !== null && state.lock_type !== -1) {
    lockNow();
  }
})

_browser.runtime.onConnect.addListener(externalPort => {
  if (state.loaded === false) {
    handleStartup();
  }
  externalPort.onDisconnect.addListener(handleClose);
});

function handleStartup() {
  loadState().then(() => {
    // TODO: check if this should really be called when triggered by onConnect (may be triggered multiple times causing the extension to lock early)
    if (state.lock_type !== null) {
      lockNow();
    }
  });
}

function handleClose() {
  storeState().then(() => {
    setLockTimer()
  });
}

function storeState(update_active) {
  if (update_active ?? true) {
    state.last_active = Date.now();
  }
  return _browser.storage.local.set({[STATE_STORE_KEY]: state}).then(() => true, () => false);
}

function loadState() {
  return _browser.storage.local.get({[STATE_STORE_KEY]: null}).then(
    state_data => {
      state = state_data[STATE_STORE_KEY];
      if (state !== null) {
        console.log('Loaded state from storage');
        state.loaded = true;
        if (state.lock_type > 0 && state.last_active !== null && ((Date.now() - state.last_active) / 60000) > state.lock_type) {
          state.pat = '';
          state.locked = true;
        }
        return true;
      } else {
        return loadDefaultState();
      }
    },
    () => {
      // Attempt to re-load some data from 'settings'
      return loadDefaultState();
    }
  );
}

function loadDefaultState() {
  console.log('Loading defaults');
  state = {...default_state};
  return _browser.storage.local.get({[APP_STORE_KEY]: null}).then(
    settings => {
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
    },
    () => {
      return storeState(false).then(() => {
        return false;
      })
    }
  );
}

function lockNow() {
  state.locked = true;
  state.pat = '';
  storeState().then(() => {
    // Clear the encryption key
    _browser.storage.local.set({[KEY_STORE_KEY]: null}).then(() => {
      // Clear the alarm so it doesn't fire again
      _browser.alarms.clear('lock-extension');
    })
  })
}

function setLockTimer() {
  if (state.lock_type !== null && state.lock_type !== -1) {
    if (state.lock_type > 0) {
      _browser.alarms.create('lock-extension', {delayInMinutes: state.lock_type});
    } else if (state.lock_type === 0) {
      lockNow();
    }
  }
}

function getPat() {
  if (typeof state.pat !== 'string') {
    return Promise.resolve({status: true, pat: decoder.decode(new Uint8Array(state.pat))});
  }
  return Promise.resolve({status: true, pat: state.pat});
}

function isLocked() {
  // This is triggered each time the extension loads, so we will use it as a point to load/generate the salt and iv for encryption
  return loadState().then(() => {
    return _browser.storage.local.get({[ENC_STORE_KEY]: null}).then(
      details => {
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
              iv: Array.apply(null, new Uint8Array(enc_details.iv)),
              salt: Array.apply(null, new Uint8Array(enc_details.salt)),
              default: enc_details.default
            }
          });
        }
      },
      () => new Promise(resolve => resolve())
    );
  }).then(
    () => {
      return _browser.storage.local.get({[APP_STORE_KEY]: {}}).then(
        settings => {
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
        },
        () => {
          return {locked: false};
        }
      );
    }
  );
}

function resetExt() {
  enc_details = {
    salt: null,
    iv: null,
    default: true
  };
  state.locked = false;
  state.lock_type = null;
  state.pat = '';

  return new Promise(resolve => resolve());
}

function unlockExt() {
  return _browser.storage.local.get({[APP_STORE_KEY]: {}}).then(
    settings => {
      if (!settings || settings.hasOwnProperty(APP_STORE_KEY) === false) {
        return {status: true};
      }
      state.pat = settings[APP_STORE_KEY]['host_pat'] || '';
      return getEncKey().then(
        key_to_use => {
          return deriveKey(key_to_use, enc_details.salt).then(
            enc_key => {
              return decryptPat(state.pat, enc_key).then(
                clear_text => {
                  if (clear_text !== 'decryption error') {
                    state.pat = clear_text;
                    state.locked = false;
                    return _browser.alarms.clear('lock-extension').then(
                      () => {return {status: true}},
                      () => {return {status: true}}
                    );
                  } else {
                    return {status: false};
                  }
                },
                () => {return {status: false}}
              );
            },
            () => {return {status: false}}
          );
        },
        () => {return {status: false}}
      );
    },
    () => {return {status: false}}
  );
}

function setEncKey(key) {
  return _browser.storage.local.set({[KEY_STORE_KEY]: key}).then(
    () => {return {status: true}},
    () => {return {status: false}}
  );
}

function getEncKey() {
  return _browser.storage.local.get({[KEY_STORE_KEY]: null}).then(
    key_data => key_data[KEY_STORE_KEY],
    () => null
  );
}

function changeEncKey(key) {
  // Set a new encryption key and re-encrypt PAT using the new key
  return this.setEncKey(key).then(
    () => this.encryptPat(state.pat),
    () => {return {status: false, host_pat: null}});
}

function decryptPat(cipher_text, enc_key) {
  const failed_promise = Promise.resolve('decryption error');
  if (enc_key && cipher_text) {
    try {
      return _crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: enc_details.iv
        },
        enc_key,
        new Uint8Array(cipher_text)
      ).then(
        decoded_buffer => {
          try {
            return decoder.decode(new Uint8Array(decoded_buffer));
          } catch (e) {
            return failed_promise
          }
        },
        () => failed_promise
      );
    } catch (e) {
      return failed_promise
    }
  }

  return failed_promise
}

function deriveKey(key, salt) {
  return getKeyMaterial(key).then(key_material => {
    return _crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: "SHA-256"
      },
      key_material,
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
  })
}

function getKeyMaterial(key) {
  return _crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
}

function encryptPat(pat_clear) {
  return _browser.storage.local.get({[KEY_STORE_KEY]: null}).then(details => {
    try {
      if (details && details.hasOwnProperty(KEY_STORE_KEY)) {
        return deriveKey(details[KEY_STORE_KEY], enc_details.salt).then(enc_key => {
          enc_details.iv = _crypto.getRandomValues(new Uint8Array(12));
          enc_details.default = details[KEY_STORE_KEY] === null;
          return _browser.storage.local.set({[ENC_STORE_KEY]: {
              iv: Array.apply(null, new Uint8Array(enc_details.iv)),
              salt: Array.apply(null, new Uint8Array(enc_details.salt)),
              default: enc_details.default
          }}).then(() => {
            return _crypto.subtle.encrypt(
              {
                name: "AES-GCM",
                iv: enc_details.iv
              },
              enc_key,
              encoder.encode(pat_clear).buffer
            ).then(
              ciphertext => {
                return {status: true, host_pat: Array.apply(null, new Uint8Array(ciphertext))}
              },
              () => {
                return {status: false, host_pat: null};
              }
            );
          });
        });
      }
    } catch (e) {
      // Do nothing
    }
    return {status: false, host_pat: null};
  });
}

function setLockType(new_lock_type) {
  state.lock_type = (new_lock_type !== null && new_lock_type !== 'null') ? parseInt(new_lock_type) : null;
  return Promise.resolve({status: true});
}
