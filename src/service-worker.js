const APP_STORE_KEY= '2fauth-app-settings',
      KEY_STORE_KEY = '2fauth-enc-key',
      ENC_STORE_KEY= '2fauth-enc-details',
      decoder = new TextDecoder(),
      encoder = new TextEncoder();

let ext_client,
  _browser = (typeof browser === "undefined") ? chrome : browser,
  _crypto = (typeof window === "undefined") ? crypto : window.crypto,
  enc_details = {
    salt: null,
    iv: null
  },
  locked = true,
  lock_timeout = null,
  lock_timer_running = false,
  pat = '';

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
      unlock(message.payload).then(data => response(data));
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

function lockNow() {
  locked = true;
  pat = '';
  lock_timer_running = false;
  // Clear the encryption key
  _browser.storage.local.set({[KEY_STORE_KEY]: null}).then(() => {
    // Clear the alarm so it doesn't fire again
    _browser.alarms.clear('lock-extension').then(() => {
    });
  })
}

_browser.runtime.onConnect.addListener(function (externalPort) {
  externalPort.onDisconnect.addListener(setLockTimer);
})

function setLockTimer() {
  if (lock_timeout !== null) {
    if (lock_timeout > 0 && !locked) {
      lock_timer_running = true;
      _browser.alarms.create('lock-extension', {periodInMinutes: lock_timeout});
    } else if (lock_timeout === 0) {
      lockNow();
    }
  }
}

function getPat(response) {
  if (typeof pat !== 'string') {
    return new Promise(resolve => resolve({status: true, pat: decoder.decode(new Uint8Array(pat))}));
  }
  return new Promise(resolve => resolve({status: true, pat: pat}));
}

function isLocked() {
  // This is triggered each time the extension loads, so we will use it as a point to load/generate the salt and iv for encryption
  return _browser.storage.sync.get({[ENC_STORE_KEY]: null}).then(details => {
      if (details && details.hasOwnProperty(ENC_STORE_KEY) && details[ENC_STORE_KEY]) {
        enc_details.iv = new Uint8Array(details[ENC_STORE_KEY]['iv']);
        enc_details.salt = new Uint8Array(details[ENC_STORE_KEY]['salt']);
        return new Promise(resolve => resolve())
      } else {
        enc_details.iv = _crypto.getRandomValues(new Uint8Array(12));
        enc_details.salt = _crypto.getRandomValues(new Uint8Array(16));
        // Store the generated salt + iv (the iv is re-generated every time the pat is encrypted)
        return _browser.storage.sync.set({[ENC_STORE_KEY]: {iv: Array.apply(null, new Uint8Array(enc_details.iv)), salt: Array.apply(null, new Uint8Array(enc_details.salt))}});
      }
    },
    () => new Promise(resolve => resolve())
  ).then(
      () => {
      return _browser.storage.sync.get({[APP_STORE_KEY]: {}}).then(settings => {
        let return_value = {locked: false};
        // The extension can only be locked if there is a PAT present in the settings
        if (settings.hasOwnProperty(APP_STORE_KEY) && settings[APP_STORE_KEY].hasOwnProperty('host_pat')) {
          return_value.locked = settings[APP_STORE_KEY]['host_pat'].length > 0 && locked === true;
        }

        return return_value;
      },
      () => {
        return {locked: false};
      });
  });
}

function resetExt() {
  enc_details = {
    salt: null,
    iv: null
  };
  locked = false;
  lock_timeout = null;
  lock_timer_running = false;
  pat = '';

  return new Promise(resolve => resolve());
}

function unlock(key) {
  return _browser.storage.sync.get({[APP_STORE_KEY]: {}}).then(settings => {
    if (!settings || settings.hasOwnProperty(APP_STORE_KEY) == false) {
      return new Promise(resolve => resolve({status: true}));
    }
    pat = settings[APP_STORE_KEY]['host_pat'] || '';
    return deriveKey(key || null, enc_details.salt).then(enc_key => {
      return decryptPat(pat, enc_key).then(clear_text => {
        if (clear_text !== 'decryption error') {
          pat = clear_text;
          return _browser.storage.local.set({[KEY_STORE_KEY]: key}).then(() => {
            locked = false;
            return {status: true};
          });
        }
        return new Promise(resolve => resolve({status: false}));
      });
    });
  });
}

function decryptPat(cipher_text, enc_key) {
  const failed_promise = new Promise(resolve => resolve('decryption error'));
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
        () => {
        return failed_promise
      });
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

function encryptPat(pat) {
  return _browser.storage.local.get({[KEY_STORE_KEY]: null}).then(details => {
    try {
      if (details && details.hasOwnProperty(KEY_STORE_KEY)) {
        return deriveKey(details[KEY_STORE_KEY], enc_details.salt).then(enc_key => {
          enc_details.iv = _crypto.getRandomValues(new Uint8Array(12));
          return _browser.storage.sync.set({[ENC_STORE_KEY]: {iv: Array.apply(null, new Uint8Array(enc_details.iv)), salt: Array.apply(null, new Uint8Array(enc_details.salt))}}).then(() => {
            return _crypto.subtle.encrypt(
              {
                name: "AES-GCM",
                iv: enc_details.iv
              },
              enc_key,
              encoder.encode(pat).buffer
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

function setLockType(lock_type) {
  lock_timeout = lock_type;
  if (lock_type === 0) {
    // Clear any existing lock timer
    _browser.alarms.clear('lock-extension');
    locked = false;
  }

  return _browser.storage.local.set({'lock-type': lock_type}).then(result => {status: true});
}

function setEncKey(key) {
  _browser
}
