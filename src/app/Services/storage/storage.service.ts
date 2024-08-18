import {Injectable, NgZone, Optional} from '@angular/core';
import {Storage, storage} from "webextension-polyfill";
import {StorageObject} from "../../Models/storageobject";

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
  public data: any = [];
  protected storeKey: string = '';
  protected storeType: StorageType = StorageType.local;
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
  protected setStorageType(storeType: StorageType) {
    this.storeType = storeType;
    this.storageArea = (storage !== undefined && storage[storeType as keyof Storage.Static] !== undefined)
      ? (storeType === StorageType.sync ? storage.sync : (storeType === StorageType.managed ? storage.managed : (storeType === StorageType.local ? storage.local : undefined)))
      : undefined;
  }

  /**
   * Store to browser
   *
   * @param data
   */
  protected saveToStorage(data: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.storageArea !== undefined) {
        this.storageArea.set({[this.storeKey]: data}).then(
          () => resolve(true),
          () => resolve(false)
        );
      } else if (this.storeType !== StorageType.sessionStorage) {
        // Put the object into localStorage
        localStorage.setItem(this.storeKey, JSON.stringify(data));
        resolve(true);
      } else {
        // Put the object into sessionStorage
        sessionStorage.setItem(this.storeKey, JSON.stringify(data));
        resolve(true);
      }
    });
  }

  /**
   * Load from browser
   *
   * @private
   */
  private loadFromStorage() {
    return new Promise((resolve, reject) => {
      if (this.storageArea !== undefined) {
        this.storageArea.get({[this.storeKey]: this.data}).then((data) => {
          resolve(data[this.storeKey]);
        }, error => {
          console.error(error);
          reject();
        });
      } else if (this.storeType !== StorageType.sessionStorage) {
        // Get from localStorage
        let object = (localStorage.getItem(this.storeKey) === null) ? this.data : JSON.parse(localStorage.getItem(this.storeKey) || '[]');
        resolve(object);
      } else {
        // Get from sessionStorage
        let object = (sessionStorage.getItem(this.storeKey) === null) ? this.data : JSON.parse(sessionStorage.getItem(this.storeKey) || '[]');
        resolve(object);
      }
    });
  }

  /**
   * Check if two objects are equal
   *
   * @param x
   * @param y
   * @protected
   */
  protected deepEqual(x: any, y: any): boolean {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
      ok(x).length === ok(y).length &&
      ok(x).every(key => this.deepEqual(x[key], y[key]))
    ) : (x === y);
  }

  /**
   * Clear the storage
   */
   public clear(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.storageArea !== undefined) {
        this.storageArea.clear().then(() => {
          resolve(true);
        }, error => {
          console.error(error);
          resolve(false);
        });
      } else if (this.storeType !== StorageType.sessionStorage) {
        // Clear localStorage
        localStorage.clear();
        resolve(true);
      } else {
        // Clear sessionStorage
        sessionStorage.clear();
        resolve(true);
      }
    });
  }

  /**
   * Remove a key
   */
  public remove(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.storageArea !== undefined) {
        this.storageArea.remove(key).then(() => {
          resolve(true);
        }, error => {
          console.error(error);
          resolve(false);
        });
      } else if (this.storeType !== StorageType.sessionStorage) {
        localStorage.removeItem(key);
        resolve(true);
      } else {
        sessionStorage.removeItem(key);
        resolve(true);
      }
    });
  }

  /**
   * Load from storage
   */
  public load(): Promise<boolean> {
    return new Promise(resolve => {
      this.loadFromStorage().then((data: any) => {
        if (typeof this.data === typeof data) {
          this.data = data;
          resolve(true);
        } else {
          resolve(false);
        }
      }, () => {
        resolve(false);
      })
    })
  }
}
