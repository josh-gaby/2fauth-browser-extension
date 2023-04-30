import {Injectable, NgZone, Optional} from '@angular/core';
import {Preferences, PreferencesClass} from "../../Models/preferences";
import {ServerService} from "../server/server.service";
import {StorageService, StorageType} from "../storage/storage.service";

@Injectable({
  providedIn: 'root'
})
export class PreferencesService extends StorageService {
  constructor(zone: NgZone, @Optional() _preferences: PreferencesClass, private serverService: ServerService) {
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
  get(key: keyof Preferences, default_value: any = null): any {
    try {
      return this.data[key];
    } catch(e) {
      console.log(e);
      return default_value;
    }
  }

  /**
   * Get the preferences from the server and save them in storage
   */
  fromServer(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.serverService.preferences().subscribe({
        next: (preferences: Preferences) => {
          // Only update the stored data if the preferences have changed
          let equal = this.objectsEqual(this.data, preferences);
          if (!equal) {
            this.data = preferences;
            this.saveToStorage();
          }
          resolve(true);
        },
        error: error => {
          console.log(error);
          reject(false);
        }
      });
    });
  }
}
