import {Injectable, NgZone, Optional} from '@angular/core';
import {Preferences, PreferencesClass} from "../../Models/preferences";
import {ServerService} from "../server/server.service";
import {StorageService} from "../storage/storage.service";

@Injectable({
  providedIn: 'root'
})
export class PreferencesService extends StorageService {
  constructor(zone: NgZone, @Optional() _preferences: PreferencesClass, private serverService: ServerService) {
    super(zone);
    let defaults = (_preferences)? _preferences : {storeKey: '', data: []};
    this.data = defaults.data;
    this.storeKey = defaults.storeKey;
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
        next: data => {
          this.data = data;
          this.setAll(this.data, this.storeKey);
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
