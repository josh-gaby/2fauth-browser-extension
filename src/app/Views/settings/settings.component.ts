import {Component, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";
import {faArrowLeftLong, faDesktop, faMoon, faSun} from "@fortawesome/free-solid-svg-icons";
import {SettingsService} from "../../Services/settings/settings.service";
import {ThemingService} from "../../Services/theming/theming.service";
import {PreferencesService} from "../../Services/preferences/preferences.service";
import {NotificationService} from "../../Services/notification/notification.service";
import {ApiService} from "../../Services/api/api.service";
import {ServiceWorkerService} from "../../Services/serviceworker/serviceworker.service";
import {SwMessageType} from "../../Models/message";
import {storage} from "webextension-polyfill";
import {InitializerService} from "../../Services/initializer/initializer.service";
import {AccountCacheService} from "../../Services/accountcache/accountcache.service";
import {SettingsClass} from "../../Models/settings";
import {PreferencesClass} from "../../Models/preferences";

enum SettingsError {
  SERVER_ACCESS = -1,
  PASSWORD = -2,
  PAT = -3,
  LOCK_TIMER = -4,
  UPDATE_PASSWORD = -5
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent {
  protected host_url: string;
  public client_id: string = '';
  public client_secret: string = '';
  public username: string = '';
  public password: string = '';
  protected current_theme: string;
  protected lock_timer: number | string | null;
  protected original_lock_timer: number | null;
  protected disable_back: boolean = false;
  protected readonly faArrowLeftLong = faArrowLeftLong;
  protected themes = [
    { text: 'Light', value: 'light', icon: faSun },
    { text: 'Dark', value: 'dark', icon: faMoon },
    { text: 'Auto', value: 'system', icon: faDesktop },
  ];

  constructor(private _sw: ServiceWorkerService,
              private account_cache: AccountCacheService,
              private api: ApiService,
              private initializer: InitializerService,
              private notifier: NotificationService,
              private preferences: PreferencesService,
              private router: Router,
              private theme: ThemingService,
              public settings: SettingsService,
  ) {
    this.disable_back = history.state?.data?.disable_back || false;
    this.host_url = this.settings.get("host_url", "");
    this.lock_timer = this.settings.get('lock_timeout', null);
    this.original_lock_timer = this.settings.get('lock_timeout', null);
    this.current_theme = this.settings.get('theme', "system");
    this.username = this.settings.get("username");
    this.client_id = this.settings.get("client_id");
    this.client_secret = this.settings.get("client_secret");
  }

  /**
   * Apply a theme
   *
   * @param theme
   */
  public setTheme(theme: string): void {
    this.current_theme = theme;
    this.settings.set('theme', theme);
    this.settings.save();
    this.theme.setTheme(theme);
  }

  /**
   * Save the settings
   */
  public saveSettings(): void {
    const old_url = this.settings.get("host_url"),
          old_username = this.settings.get("username"),
          old_client_id = this.settings.get("client_id"),
          old_client_secret = this.settings.get("client_secret"),
          server_details_changed = this.host_url !== old_url || this.client_id !== old_client_id || this.client_secret !== old_client_secret || this.password !== '' || this.username !== old_username;

    this.settings.set('host_url', this.host_url);
    this.settings.set('username', this.username);
    this.settings.set('client_id', this.client_id);
    this.settings.set('client_secret', this.client_secret);

    let first: Promise<boolean | SettingsError>;
    // If the server details have changed, test that they can be used to access the server
    if (server_details_changed) {
      // TODO: Request the users password using a popup instead of a standard input
      first = this.api.requestAccessToken(this.password).then(
        results => {
          return (results || SettingsError.SERVER_ACCESS)
        },
        () => {
          return SettingsError.SERVER_ACCESS
        }
      )
    } else {
      first = Promise.resolve(true);
    }

    first.then(results => {
      // Update the lock timer
      if (results === true) {
        return this.updateLockTimer();
      }
      return results;
    }).then(results => {
      switch (results) {
        case true:
          this.settings.save().then(() => {
            if (server_details_changed) {
              // Load the current user preferences from the server
              this.preferences.updateFromServer().then(() => {
                // Redirect to the main accounts page
                this.router.navigate(['/accounts']);
              });
            } else {
              // Redirect to the main accounts page
              this.router.navigate(['/accounts']);
            }
          });
          break;
        case SettingsError.SERVER_ACCESS:
          this.settings.set('host_url', old_url);
          this.settings.set('client_id', old_client_id);
          this.settings.set('client_secret', old_client_secret);
          this.settings.set('username', old_username);

          // Failed to load preferences, let the user know and stay on the settings page
          this.notifier.error("Couldn't connect to the specified server", 3000);
          break;
        default:
          this.notifier.error("Failed to save settings", 3000);
          break;
      }
    });
  }

  /**
   * Update the lock timer type
   *
   * @private
   */
  private updateLockTimer() {
    this.lock_timer = this.lock_timer === 'null' ? null : this.lock_timer as number;
    if (this.lock_timer !== this.original_lock_timer) {
      this.settings.set('lock_timeout', this.lock_timer);
      return this._sw.sendMessage(SwMessageType.SET_LOCK_TYPE, this.lock_timer).then(
        status => (status.data.status || SettingsError.LOCK_TIMER),
        () => SettingsError.LOCK_TIMER
      );
    } else {
      return Promise.resolve(true);
    }
  }

  public clearStorage() {
    if (confirm("Reset extension storage?")) {
      localStorage.clear();
      storage.local.clear().then(() => {
        storage.sync.clear().then(() => {
          this._sw.sendMessage(SwMessageType.RESET_EXT).then(() => {
            this.settings.data = new SettingsClass();
            this.preferences.data = new PreferencesClass();
            this.account_cache.data = [];
            this.initializer.initApp();
            window.close();
          });
        });
      })
    }
  }
}
