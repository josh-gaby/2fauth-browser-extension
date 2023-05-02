import { Injectable } from '@angular/core';
import {SettingsService} from "../settings/settings.service";
import {ThemingService} from "../theming/theming.service";
import {PreferencesService} from "../preferences/preferences.service";
import {AccountCacheService} from "../accountcache/accountcache.service";
import {ServiceWorkerService} from "../serviceworker/serviceworker.service";

@Injectable({
  providedIn: 'root'
})
export class InitializerService {
  constructor(private settings: SettingsService,
              private preferences: PreferencesService,
              private accountCache: AccountCacheService,
              private theme: ThemingService,
              private _sw: ServiceWorkerService
  ) { }

  public load(): Promise<any> {
    // Reapply the theme that was last applied on this system
    this.theme.applyPrevious();
    // Load the settings
    return new Promise((resolve, reject) => {
      // First load settings from storage
      this.settings.load().then(() => {
        // Next, load the account cache
        this.accountCache.load();
        // Then apply the theme currently stored in the settings since this could have been updated on a different system
        this.theme.setTheme(this.settings.get('theme'));
        // Finally, load any stored preferences from storage
        this.preferences.load();
        resolve(true);
      }, () => {
        reject(false);
      })
    });
  }
}
