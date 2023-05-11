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
    // First, load settings from storage
    return new Promise(resolve => {
      this.settings.load().then(() => {
        let first: Promise<boolean>;
        if (!this.settings.get('locked') && this.settings.get('expiry_time') && this.settings.get('expiry_time') < Date.now() && this.settings.get('refresh_token')) {
          first = this.api.refreshToken();
        } else {
          first = Promise.resolve(true);
        }
        first.then(response => {
          if (response) {
            // Next, load the account cache
            this.account_cache.load().then(() => {
              // Finally, load any stored preferences from storage
              this.preferences.load().then(() => resolve(true));
            });
          } else {
            // TODO: Handle not able to refresh the token
          }
        });
      });
    });
  }

  initApp() {
    if (!this.settings.get("host_url") || !this.settings.get("username") || !this.settings.get("client_id") || !this.settings.get("client_secret")) {
      this.redirectSettings();
    } else {
      this.redirectAccounts();
    }
  }

  redirectSettings() {
    // Redirect to the settings screen with no back button
    this.router.navigate(['/settings'], {state: {data: {disable_back: true}}});
  }

  redirectAccounts() {
    // Load the current user preferences from the server
    this.preferences.updateFromServer();
    this.theme.setTheme(this.settings.get('theme'));
    // Redirect to the accounts page
    this.router.navigate(['/accounts']);
  }
}
