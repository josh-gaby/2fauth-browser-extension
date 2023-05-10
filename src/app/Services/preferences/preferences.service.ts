import {Injectable, NgZone, Optional} from '@angular/core';
import {Preferences, PreferencesClass} from "../../Models/preferences";
import {ApiService} from "../api/api.service";
import {StorageService, StorageType} from "../storage/storage.service";

@Injectable({
  providedIn: 'root'
})
export class PreferencesService extends StorageService {
  constructor(zone: NgZone, @Optional() _preferences: PreferencesClass, private api: ApiService) {
    let defaults = (_preferences)? _preferences : new PreferencesClass();
    super(zone, defaults);
    this.setStorageType(StorageType.local);
  }

  /**
   * Get the value of a preference
   *
   * @param key
   * @param default_value
   */
  public get(key: keyof Preferences, default_value: any = null): any {
    try {
      return this.data[key];
    } catch(e) {
      return default_value;
    }
  }

  /**
   * Get the preferences from the server and save them in storage
   */
  public updateFromServer(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.api.getPreferences().subscribe({
        next: preferences => {
          // Only update the stored data if the preferences have changed
          let equal = this.deepEqual(this.data, preferences);
          if (!equal) {
            this.data = preferences;
            this.saveToStorage(preferences).then(status => resolve(status));
          } else {
            resolve(true);
          }
        },
        error: error => {
          resolve(false);
        }
      });
    });
  }
}
