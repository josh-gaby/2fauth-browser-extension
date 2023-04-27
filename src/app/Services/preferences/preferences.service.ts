import { Injectable } from '@angular/core';
import {Preferences} from "../../Models/preferences";
import {ServerService} from "../server/server.service";

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private preferences: Preferences;
  constructor(private serverService: ServerService) {
    this.preferences = this.load();
  }

  get(key: keyof Preferences): any {
    return this.preferences[key]
  }

  getPreferences(): Preferences {
    return this.preferences;
  }

  save(): void {

  }

  store(): void {
    localStorage.setItem('preferences', JSON.stringify(this.preferences));
  }

  /**
   * Get the preferences from the server and store them
   */
  fromServer(): void {
    this.serverService.preferences().subscribe(preferences => {
      this.preferences = preferences;
      localStorage.setItem('preferences', JSON.stringify(preferences));
    });
  }

  /**
   * Load preferences, if not available locally, retrieve them from the server
   */
  load(): Preferences {
    if (localStorage.getItem("preferences") === null) {
      this.fromServer();
    }

    return JSON.parse(localStorage.getItem('preferences') || '') as Preferences;
  }
}
