import {Injectable, NgZone, Optional} from '@angular/core';
import {Settings, SettingsClass } from "../../Models/settings";
import {StorageService} from "../storage/storage.service";

@Injectable({
  providedIn: 'root'
})
export class SettingsService extends StorageService {

  constructor(zone: NgZone, @Optional() _settings: SettingsClass) {
    super(zone)
    let defaults = (_settings)? _settings : new SettingsClass();
    this.data = defaults.data;
    this.storeKey = defaults.storeKey;
  }

  /**
   * Get the value of a setting
   *
   * @param key
   * @param default_value
   */
  get(key: keyof Settings, default_value: any = null): any {
    try {
      return this.data[key];
    } catch(e) {
      console.log(e);
      return default_value;
    }
  }

  /**
   * Set the value of a setting
   *
   * @param key
   * @param value
   */
  set(key: keyof Settings, value: any): void {
    this.data[key] = value;
  }

  /**
   * Save the current settings to storage
   */
  save(): void {
    this.setAll(this.data, this.storeKey);
  }
}
