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
      ? (storeType === 'sync' ? storage.sync : (storeType === 'managed' ? storage.managed : (storeType === 'local' ? storage.local : undefined)))
      : undefined;
  }

  /**
   * Store to browser
   *
   * @param data
   * @param key
   */
  saveToStorage(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.storageArea !== undefined) {
        let object = {};
        // @ts-ignore
        object[this.storeKey] = this.data;
        this.storageArea.set(object).then(()=> {
          resolve(true);
        }, error => {
          console.log(error);
          reject(false);
        });
      } else {
        if  (this.storeType !== StorageType.sessionStorage) {
          // Put the object into localStorage
          localStorage.setItem(this.storeKey, JSON.stringify(this.data));
          resolve(true);
        } else {
          // Put the object into sessionStorage
          sessionStorage.setItem(this.storeKey, JSON.stringify(this.data));
          resolve(true);
        }
      }
    });
  }

  /**
   * Load from browser
   *
   * @param key
   * @param defaults
   * @private
   */
  private loadFromStorage(key: string, defaults = {}) {
    return new Promise((resolve, reject) => {
      if (this.storageArea !== undefined) {
        let object = {};
        // @ts-ignore
        object[key] = defaults;
        this.storageArea.get(object).then((data) => {
          resolve(data[key]);
        }, error => {
          console.log(error);
          reject();
        });
      } else {
        if (this.storeType !== StorageType.sessionStorage) {
          // Get from localStorage
          let object =  (localStorage.getItem(key) === null) ? defaults : JSON.parse(localStorage.getItem(key) || '{}');
          resolve(object);
        } else {
          // Get from sessionStorage
          let object =  (sessionStorage.getItem(key) === null) ? defaults : JSON.parse(sessionStorage.getItem(key) || '{}');
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
  protected objectsEqual(o1: any, o2: any): boolean {
    try {
      if (o2 === null && o1 !== null) return false;
      return o1 !== null && typeof o1 === 'object' && Object.keys(o1).length > 0 ?
        Object.keys(o1).length === Object.keys(o2).length &&
        Object.keys(o1).every(p => this.objectsEqual(o1[p], o2[p]))
        : (o1 !== null && Array.isArray(o1) && Array.isArray(o2) && !o1.length &&
          !o2.length) ? true : o1 === o2;
    } catch (e) {
      return false;
    }
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
      this.loadFromStorage(this.storeKey, this.data).then((data: any) => {
        this.data = data;
        resolve(true);
      }, () => {
        resolve(false);
      })
    })
  }
}
