import {Injectable, NgZone, Optional} from '@angular/core';
import {Settings, SettingsClass } from "../../Models/settings";
import {storage} from "webextension-polyfill";
import {from, Observable, of, Subject} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  storeKey = '';
  config: Settings;

  constructor(private zone: NgZone, @Optional() _settings: SettingsClass) {
    let defaultSettings = (_settings)? _settings : new SettingsClass();
    this.config = defaultSettings.data;
    this.storeKey = defaultSettings.storeKey;
  }

  setAll(settings: Object, key = this.storeKey): Promise<boolean> {
    console.log("Saving: ", settings);
    return new Promise((resolve, reject) => {
      if (storage !== undefined && storage.local != undefined) {
        let object = {};
        // @ts-ignore
        object[key] = settings;
        storage.local.set(object).then(()=> {
          resolve(true);
        }, error => {
          console.log(error);
          reject(false);
        });
      } else {
        // Put the object into storage
        localStorage.setItem(key, JSON.stringify(settings));
        resolve(true);
      }
    });
  }

  private getBrowser(key: string, defaults = {}) {
    return new Promise((resolve, reject) => {
      if (storage != undefined && storage.local != undefined) {
        let object = {};
        // @ts-ignore
        object[key] = defaults;
        storage.local.get(object).then((data) => {
          resolve(data[key]);
        }, error => {
          console.log(error);
        });
      } else {
        let object =  (localStorage.getItem(key) === null) ? defaults : JSON.parse(localStorage.getItem(key) || '{}');
        resolve(object);
      }
    });
  }

  // clears the storage
  clear(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (storage !== undefined && storage.local != undefined) {
        storage.local.clear().then(() => {
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

  // remove a key
  remove(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (storage !== undefined && storage.local != undefined) {
        storage.local.remove(key).then(() => {
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

  get(key: keyof Settings): any {
    return this.config[key];
  }

  set(key: keyof Settings, value: any): void {
    this.config[key] = value;
  }

  save(): void {
    this.setAll(this.config, this.storeKey);
  }

  /**
   * Load settings
   */
  load(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getBrowser(this.storeKey, this.config).then((data: any) => {
        this.config = data;
        resolve(true);
      }, () => {
        resolve(false);
      })
    })
  }
}
