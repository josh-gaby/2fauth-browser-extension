import { Injectable } from '@angular/core';
import {ServiceWorkerService} from "../serviceworker/serviceworker.service";
import {SettingsService} from "../settings/settings.service";
import {Router} from "@angular/router";
import {ThemingService} from "../theming/theming.service";
import {PreferencesService} from "../preferences/preferences.service";
import {ApiService} from "../api/api.service";
import {NotificationService} from "../notification/notification.service";
import {SwMessageType} from "../../Models/message";
import {LocalSettingsService} from "../localsettings/localsettings.service";

@Injectable({
  providedIn: 'root'
})
export class InitCheckService {

  constructor(private api: ApiService,
              private notifier: NotificationService,
              private preferences: PreferencesService,
              private router: Router,
              private settings: SettingsService,
              private local_settings: LocalSettingsService,
              private theme: ThemingService,
              private _sw: ServiceWorkerService,
  ) { }

  initApp() {
    // It's not locked, request the PAT from the background worker
    this._sw.sendMessage(SwMessageType.GET_PAT).then(response => {
      this.settings.set('decoded_pat', response.data.pat);
      if (!this.settings.get("host_url") || !this.settings.get("host_url")) {
        // Missing the host URL or PAT, display the settings page so that they can be entered
        this.router.navigate(['/settings'], {state: {data: {disable_back: true}}});
      } else if (this.api.invalid_token) {
        this.notifier.error("Invalid Personal Access Token", 3000);
        this.router.navigate(['/settings'], {state: {data: {disable_back: true}}});
      } else {
        // Load the current user preferences from the server
        this.preferences.updateFromServer();
        this.theme.setTheme(this.local_settings.get('theme'));
        // Redirect to the accounts page
        this.router.navigate(['/accounts']);
      }
    });
  }
}
