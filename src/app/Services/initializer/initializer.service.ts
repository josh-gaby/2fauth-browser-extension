import {Injectable} from '@angular/core';
import {SettingsService} from "../settings/settings.service";
import {ThemingService} from "../theming/theming.service";
import {PreferencesService} from "../preferences/preferences.service";
import {AccountCacheService} from "../accountcache/accountcache.service";
import {ServiceWorkerService} from "../serviceworker/serviceworker.service";
import {SwMessageType} from "../../Models/message";
import {ApiService} from "../api/api.service";
import {NotificationService} from "../notification/notification.service";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class InitializerService {
  constructor(private account_cache: AccountCacheService,
              private api: ApiService,
              private notifier: NotificationService,
              private preferences: PreferencesService,
              private router: Router,
              private settings: SettingsService,
              private theme: ThemingService,
              private _sw: ServiceWorkerService,

  ) { }

  public load(): Promise<any> {
    // Reapply the theme that was last applied on this system
    this.theme.applyPrevious();
    // Load the settings
    return new Promise(resolve => {
      // Next, load settings from storage
      this.settings.load().then(() => {
        // Next, load the account cache
        this.account_cache.load().then(() => {
          // Finally, load any stored preferences from storage
          this.preferences.load().then(() => resolve(true));
        });
      });
    });
  }

  initApp() {
    // It's not locked, request the PAT from the background worker
    this._sw.sendMessage(SwMessageType.GET_PAT).then(response => {
      this.settings.set('decoded_pat', response.data.pat);
      if (!this.settings.get("host_url") || !this.settings.get("host_pat")) {
        // Missing the host URL or PAT, display the settings page so that they can be entered
        this.router.navigate(['/settings'], {state: {data: {disable_back: true}}});
      } else if (this.api.invalid_token) {
        this.notifier.error("Invalid Personal Access Token", 3000);
        this.router.navigate(['/settings'], {state: {data: {disable_back: true}}});
      } else {
        // Load the current user preferences from the server
        this.preferences.updateFromServer();
        this.theme.setTheme(this.settings.get('theme'));
        // Redirect to the accounts page
        this.router.navigate(['/accounts']);
      }
    });
  }
}
