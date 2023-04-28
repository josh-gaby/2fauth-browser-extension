import {Injectable, NgZone, Optional} from '@angular/core';
import {Preferences, PreferencesClass} from "../../Models/preferences";
import {ServerService} from "../server/server.service";
import {SettingsService} from "../settings/settings.service";
import {Settings, SettingsClass} from "../../Models/settings";

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  storeKey = '';
  config: Preferences;
  constructor(private zone: NgZone, @Optional() _preferences: PreferencesClass, private serverService: ServerService, private settings: SettingsService) {
    let defaultPreferences = (_preferences)? _preferences : new PreferencesClass();
    this.config = defaultPreferences.data;
  }

  get(key: keyof Preferences): any {
    return this.config[key]
  }

  getPreferences(): Preferences {
    return this.config;
  }

  save(): void {

  }

  store(): void {
    localStorage.setItem(this.storeKey, JSON.stringify(this.config));
  }

  /**
   * Get the preferences from the server and store them
   */
  fromServer(): void {
    this.serverService.preferences().subscribe(data => {
      this.config = data;
    });
  }

  /**
   * Load preferences, if not available locally, retrieve them from the server
   */
  load(): Preferences {
    if (!localStorage.getItem(this.storeKey)) {
      this.fromServer();
    }

    return JSON.parse(localStorage.getItem(this.storeKey) || '{}') as Preferences;
  }
}
