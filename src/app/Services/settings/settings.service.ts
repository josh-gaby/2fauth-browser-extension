import {Injectable, NgZone, Optional} from '@angular/core';
import {Settings, SettingsClass} from "../../Models/settings";
import {StorageService, StorageType} from "../storage/storage.service";

@Injectable({
  providedIn: 'root'
})
export class SettingsService extends StorageService {

  constructor(zone: NgZone, @Optional() _settings: SettingsClass) {
    let defaults = (_settings)? _settings : new SettingsClass();
    super(zone, defaults);
    this.setStorageType(StorageType.sync);
  }

  /**
   * Get the value of a setting
   *
   * @param key
   * @param default_value
   */
  public get(key: keyof Settings, default_value: any = null): any {
    try {
      return this.data[key];
    } catch(e) {
      console.error(e);
      return default_value;
    }
  }

  /**
   * Set the value of a setting
   *
   * @param key
   * @param value
   */
  public set(key: keyof Settings, value: any): void {
    this.data[key] = value;
  }

  /**
   * Save the current settings to storage
   */
  public save(): void {
    let save_data = {...this.data};
    save_data.decoded_pat = '';
    this.saveToStorage(save_data);
  }
}
