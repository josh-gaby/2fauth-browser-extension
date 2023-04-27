import { Injectable } from '@angular/core';
import {Settings} from "../../Models/settings";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settings: Settings;
  constructor() {
    this.settings = this.load();
  }

  get(key: keyof Settings): any {
    return this.settings[key]
  }

  set(key: keyof Settings, value: any): void {
    this.settings[key] = value;
  }

  save(): void {
    localStorage.setItem('settings', JSON.stringify(this.settings));
  }

  /**
   * Load settings
   */
  load(): Settings {
    return JSON.parse(localStorage.getItem('settings') || '{}') as Settings;
  }
}
