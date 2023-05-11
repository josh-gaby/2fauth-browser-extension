const APP_STORE_KEY = '2fauth-app-settings',
  STATE_STORE_KEY = '2fauth-state',
  _browser = (typeof browser === "undefined") ? chrome : browser,
  _crypto = (typeof window === "undefined") ? crypto : window.crypto,
  default_state = {
    loaded: false,
    locked: true,
    last_active: null,
    lock_type: false
  };

let ext_client,
    state = {...default_state};

_browser.windows.onRemoved.addListener(handleBrowserClosed);
_browser.runtime.onStartup.addListener(handleStartup);
_browser.runtime.onInstalled.addListener(handleStartup);
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
    case 'UNLOCK-EXT':
      unlockExt().then(data => response(data));
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
      return lockNow();
    } else {
      return Promise.resolve(true);
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
            return _checkLock().then(() => true);
          }, () => false)
        } else {
          return _checkLock().then(() => true);
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
  return storeState().then(() => {
    return _browser.storage.local.get(APP_STORE_KEY).then(settings => {
      settings = settings[APP_STORE_KEY];
      settings.access_token = null;
      settings.refresh_token = null;
      settings.expiry_time = null;
      settings.locked = true;
      return _browser.storage.local.set({[APP_STORE_KEY]: settings}).then(() => {
        // Clear the alarm so it doesn't fire again
        return _browser.alarms.clear('lock-extension');
      });
    });
  })
}

/**
 * Enable the lock timer
 */
function setLockTimer() {
  if (state.lock_type !== null && state.lock_type !== -1) {
    if (state.lock_type > 0) {
      _browser.alarms.create('lock-extension', {delayInMinutes: state.lock_type});
    } else if (state.lock_type === 0) {
      lockNow();
    }
  }
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
  state.locked = false;
  return Promise.resolve({status: true});
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
