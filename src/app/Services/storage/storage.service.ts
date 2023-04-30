import {Injectable, NgZone, Optional} from '@angular/core';
import {Storage, storage} from "webextension-polyfill";
import {StorageObject} from "../../Models/storageobject";
import Static = Storage.Static;

export enum StorageType {
  local = 'local',
  sync = 'sync',
  managed = 'managed',
  localStorage = 'localStorage',
  sessionStorage = 'sessionStorage'
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  storeKey: string = '';
  data: any = [];
  storeType: StorageType = StorageType.local;
  protected storageArea: Storage.StorageAreaSync | Storage.StorageArea | undefined = undefined;
  constructor(private zone: NgZone, defaults: StorageObject) {
    this.data = defaults.data;
    this.storeKey = defaults.storeKey;
  }

  /**
   * Set the storage type to be used
   *
   * @param storeType
   */
  setStorageType(storeType: StorageType) {
    this.storeType = storeType;
    this.storageArea = (storage !== undefined && storage[storeType as keyof Static] !== undefined)
      ? (storeType === StorageType.sync ? storage.sync : (storeType === StorageType.managed ? storage.managed : (storeType === StorageType.local ? storage.local : undefined)))
      : undefined;
  }

  /**
   * Store to browser
   *
   * @param data
   */
  saveToStorage(data: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.storageArea !== undefined) {
        this.storageArea.set({[this.storeKey]: data}).then(() => {
          resolve(true);
        }, error => {
          console.log(error);
          reject(false);
        });
      } else {
        if  (this.storeType !== StorageType.sessionStorage) {
          // Put the object into localStorage
          localStorage.setItem(this.storeKey, JSON.stringify(data));
          resolve(true);
        } else {
          // Put the object into sessionStorage
          sessionStorage.setItem(this.storeKey, JSON.stringify(data));
          resolve(true);
        }
      }
    });
  }

  /**
   * Load from browser
   *
   * @param defaults
   * @private
   */
  private loadFromStorage(defaults = []) {
    return new Promise((resolve, reject) => {
      if (this.storageArea !== undefined) {
        this.storageArea.get({[this.storeKey]: defaults}).then((data) => {
          console.log(`Loaded data from ${this.storeType}`, data);
          resolve(data[this.storeKey]);
        }, error => {
          console.log(error);
          reject();
        });
      } else {
        if (this.storeType !== StorageType.sessionStorage) {
          // Get from localStorage
          let object =  (localStorage.getItem(this.storeKey) === null) ? defaults : JSON.parse(localStorage.getItem(this.storeKey) || '[]');
          resolve(object);
        } else {
          // Get from sessionStorage
          let object =  (sessionStorage.getItem(this.storeKey) === null) ? defaults : JSON.parse(sessionStorage.getItem(this.storeKey) || '[]');
          resolve(object);
        }
      }
    });
  }

  /**
   * Check if two objects are equal
   *
   * @param o1
   * @param o2
   * @protected
   */
  deepEqual(x: any, y: any): boolean {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
      ok(x).length === ok(y).length &&
      ok(x).every(key => this.deepEqual(x[key], y[key]))
    ) : (x === y);
  }

  /**
   * Clear the storage
   */
  clear(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.storageArea !== undefined) {
        this.storageArea.clear().then(() => {
          resolve(true);
        }, error => {
          console.log(error);
          resolve(false);
        });
      } else {
        if (this.storeType !== StorageType.sessionStorage) {
          // Clear localStorage
          localStorage.clear();
          resolve(true);
        } else {
          // Clear sessionStorage
          localStorage.clear();
          resolve(true);
        }
      }
    });
  }

  /**
   * Remove a key
   */
  remove(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.storageArea !== undefined) {
        this.storageArea.remove(key).then(() => {
          resolve(true);
        }, error => {
          console.log(error);
          resolve(false);
        });
      } else {
        if (this.storeType !== StorageType.sessionStorage) {
          localStorage.removeItem(key);
          resolve(true);
        } else {
          sessionStorage.removeItem(key);
          resolve(true);
        }
      }
    });
  }

  /**
   * Load from storage
   */
  load(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.loadFromStorage().then((data: any) => {
        console.log("Loaded data: ", data);
        this.data = data;
        resolve(true);
      }, () => {
        resolve(false);
      })
    })
  }
}
