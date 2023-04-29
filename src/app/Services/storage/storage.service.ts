import {Injectable, NgZone, Optional} from '@angular/core';
import {storage} from "webextension-polyfill";
import {StorageObject} from "../../Models/storageobject";

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  storeKey: string = '';
  data: any;
  constructor(private zone: NgZone) {}

  /**
   * Store to browser
   *
   * @param data
   * @param key
   */
  setAll(data: Object, key = this.storeKey): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (storage !== undefined && storage.sync !== undefined) {
        let object = {};
        // @ts-ignore
        object[key] = data;
        storage.sync.set(object).then(()=> {
          resolve(true);
        }, error => {
          console.log(error);
          reject(false);
        });
      } else {
        // Put the object into storage
        localStorage.setItem(key, JSON.stringify(data));
        resolve(true);
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
  private getBrowser(key: string, defaults = {}) {
    return new Promise((resolve, reject) => {
      if (storage !== undefined && storage.sync !== undefined) {
        let object = {};
        // @ts-ignore
        object[key] = defaults;
        storage.sync.get(object).then((data) => {
          resolve(data[key]);
        }, error => {
          console.log(error);
          reject();
        });
      } else {
        let object =  (localStorage.getItem(key) === null) ? defaults : JSON.parse(localStorage.getItem(key) || '{}');
        resolve(object);
      }
    });
  }

  /**
   * Clear the storage
   */
  clear(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (storage !== undefined && storage.sync !== undefined) {
        storage.sync.clear().then(() => {
          resolve(true);
        }, error => {
          console.log(error);
          resolve(false);
        });
      } else {
        localStorage.clear();
        resolve(true);
      }
    });
  }

  /**
   * Remove a key
   */
  remove(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (storage !== undefined && storage.sync !== undefined) {
        storage.sync.remove(key).then(() => {
          resolve(true);
        }, error => {
          console.log(error);
          resolve(false);
        });
      } else {
        localStorage.removeItem(key);
        resolve(true);
      }
    });
  }

  /**
   * Load settings
   */
  load(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getBrowser(this.storeKey, this.data).then((data: any) => {
        this.data = data;
        resolve(true);
      }, () => {
        resolve(false);
      })
    })
  }
}
