import {Injectable, NgZone, Optional} from '@angular/core';
import {LocalSettings, LocalSettingsClass} from "../../Models/localsettings";
import {StorageService, StorageType} from "../storage/storage.service";

@Injectable({
  providedIn: 'root'
})
export class LocalSettingsService extends StorageService {

  constructor(zone: NgZone, @Optional() _settings: LocalSettingsClass) {
    let defaults = (_settings)? _settings : new LocalSettingsClass();
    super(zone, defaults);
    this.setStorageType(StorageType.local);
  }

  /**
   * Get the value of a setting
   *
   * @param key
   * @param default_value
   */
  public get(key: keyof LocalSettings, default_value: any = null): any {
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
  public set(key: keyof LocalSettings, value: any): void {
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
