const setting_key = '2fauth-app-settings';
let ext_client,
  _browser = (typeof browser === "undefined") ? chrome : browser,
  pat = '',
  locked = false,
  lock_timeout = 1
  _crypto = (typeof window === "undefined") ? crypto : window.crypto,
  enc_details = {
    salt: null,
    iv: null
  };

_browser.runtime.onMessage.addListener((message, sender, response) => {
  const message_type = message.type ? message.type : undefined;
  console.debug(`Got message: ${message_type}`);
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
    case 'EXT-CLOSING':
      if (lock_timeout !== 0) {
        _browser.alarms.create('lock-extension', {periodInMinutes: lock_timeout});
      }
  }

  return true;
});

_browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'lock-extension') {
    console.log("Extension Locked");
    locked = true;
    pat = '';
    _browser.alarms.clear('lock-extension').then(() => {
      // Clear the encryption key
      _browser.storage.local.set({'2fauth-enc-key': null});
    });
  }
});

function getPat(response) {
  return new Promise(resolve => resolve({status: true, pat: pat}));
}

function isLocked() {
  // This is triggered each time the extension loads, wo we will use it as a point to load/generate the salt/iv for encryption
  return _browser.storage.sync.get({'2fauth-enc-details': null}).then(details => {
    if (details && details.hasOwnProperty('2fauth-enc-details') && details['2fauth-enc-details']) {
      enc_details.iv = details['2fauth-enc-details']['iv'];
      enc_details.salt = details['2fauth-enc-details']['salt'];
      console.log(enc_details);
      return new Promise(resolve => resolve())
    } else {
      enc_details.salt = _crypto.getRandomValues(new Uint8Array(16));
      return _browser.storage.sync.set({'2fauth-enc-details': {iv: enc_details.iv, salt: enc_details.salt}});
    }
  }).then(() => {
    return _browser.storage.sync.get({[setting_key]: {}}).then(settings => {
      let return_value = {locked: false};
      // The extension can only be locked if there is a PAT present in the settings
      if (settings.hasOwnProperty(setting_key) && settings[setting_key].hasOwnProperty('host_pat')) {
        return_value.locked = settings[setting_key]['host_pat'].length > 0 && locked === true;
      }

      return return_value;
    });
  });
}

function unlock(key) {
  return _browser.storage.sync.get({[setting_key]: {}}).then(settings => {
    pat = settings['2fauth-app-settings']['host_pat'] || '';
    if (pat.length > 4 && pat.substring(0,4, pat) !== 'enc-') {
      console.debug("Key not encrypted");
      return new Promise(resolve => resolve({status: true}));
    }
    return deriveKey(key, enc_details.salt).then(enc_key => {
      return decryptPat(pat, enc_key).then(clear_text => {
        console.log("Unlock results: " + clear_text);
        if (clear_text !== 'decryption error') {
          pat = clear_text;
        }
        return _browser.storage.local.set({'2fauth-enc-key': key}).then(() => {
          return {status: true};
        });
      });
    });
  });
}

function decryptPat(cipher_text) {
  return _browser.storage.local.get({'2fauth-enc-key': null}).then(details => {
    try {
      if (details && details.hasOwnProperty('2fauth-enc-key')) {
        try {
          return deriveKey(details['2fauth-enc-key'], enc_details.salt).then(enc_key => {
            if (enc_key) {
              try {
                if (pat.length > 4 && pat.substring(0,4, pat) !== 'enc-') {
                  console.debug("Key not encrypted");
                  return new Promise(resolve => resolve(pat));
                }
                const encoder = new TextEncoder();
                console.log(cipher_text, cipher_text.substring(4), encoder.encode(cipher_text.substring(4)), enc_details.iv);
                return _crypto.subtle.decrypt(
                  {
                    name: "AES-GCM",
                    iv: enc_details.iv
                  },
                  enc_key,
                  encoder.encode(cipher_text.substring(4))
                ).then(clear_text => {
                  console.log(clear_text);
                  let dec = new TextDecoder();
                  return dec.decode(clear_text);
                });
              } catch (e) {
                console.error(e);
                // Do nothing
              }
            }
          });
        } catch (e) {
          console.error(e);
          // Do nothing
        }
      }
    } catch (e) {
      console.error(e);
      // Do nothing
    }
    return new Promise(resolve => resolve('decryption error'))
  });
}

function deriveKey(key, salt) {
  return getKeyMaterial(key).then(key_material => {
    const enc = new TextEncoder();
    return _crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
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
  const enc = new TextEncoder();
  return _crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
}

function encryptPat(pat) {
  let enc = new TextEncoder(),
      clear_text = enc.encode(pat);
  return _browser.storage.local.get({'2fauth-enc-key': null}).then(details => {
    try {
      if (details && details.hasOwnProperty('2fauth-enc-key')) {
        return deriveKey(details['2fauth-enc-key'], enc_details.salt).then(enc_key => {
          enc_details.iv = _crypto.getRandomValues(new Uint8Array(12));
          return _browser.storage.sync.set({'2fauth-enc-details': {iv: enc_details.iv, salt: enc_details.salt}}).then(() => {
            return _crypto.subtle.encrypt(
              {
                name: "AES-GCM",
                iv: enc_details.iv
              },
              enc_key,
              clear_text
            ).then(ciphertext => {
              const decoder = new TextDecoder();
              return {status: true, host_pat: decoder.decode(ciphertext)}
            });
          });
        });
      }
    } catch (e) {
      console.log(e);
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
