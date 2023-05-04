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
  private host_pat: string;
  public have_pat: boolean = false;
  public starred_pat: string = '';
  protected new_pat: string = '';
  protected new_password: string = '';
  protected themes = [
    { text: 'Light', value: 'light', icon: faSun },
    { text: 'Dark', value: 'dark', icon: faMoon },
    { text: 'Auto', value: 'system', icon: faDesktop },
  ];
  protected current_theme: string;
  protected lock_timer: number | string | null;
  protected original_lock_timer: number | null;
  protected disable_back: boolean = false;
  protected password_set: boolean = false;
  protected readonly faArrowLeftLong = faArrowLeftLong;

  constructor(private _sw: ServiceWorkerService,
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
    this.host_pat = this.settings.get("decoded_pat", "");
    this.password_set = this.settings.get("password_set", false);
    this.have_pat = this.host_pat.length > 0;
    this.starred_pat = this.getStarredPat();
    this.lock_timer = this.settings.get('lock_timeout', null);
    this.original_lock_timer = this.settings.get('lock_timeout', null);
    this.current_theme = this.settings.get('theme', "system");
  }

  private getStarredPat(): string {
    let length = this.host_pat.length;
    if (length === 0) {
      return '';
    }
    let start_end_length = length > 100 ? 20 : (length > 50 ? 15 : (length > 20 ? 5 : 1));
    return this.host_pat.substring(0, start_end_length) + '*'.repeat(Math.min(350, this.host_pat.length - (start_end_length * 2))) + this.host_pat.substring(this.host_pat.length - start_end_length);
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
    const update_pat: boolean = this.new_pat.length > 0,
          update_password: boolean = this.new_password.length > 0,
          old_url = this.settings.get("host_url"),
          old_pat = this.settings.get("decoded_pat");

    this.settings.set('host_url', this.host_url);

    if (old_url && (old_pat || update_pat)) {
      if (update_pat) {
        this.settings.set('decoded_pat', this.new_pat);
      }

      // TODO: make sure update from server can return false if it fails or is unauthorized.
      this.preferences.updateFromServer().then(
        status => {
          if (status === true) {
            // Preferences loaded successfully
            this.api.invalid_token = false;
            return true;
          }
          return SettingsError.SERVER_ACCESS;
        },
        () => SettingsError.SERVER_ACCESS
      ).then(results => {
        // Update the password
        if (results === true && update_password) {
          this.password_set = true;
          if (!update_pat) {
            // Update the password and re-encrypt the current PAT using the key
            return this._sw.sendMessage(SwMessageType.CHANGE_ENC_KEY, this.new_password).then(response => (response.data.status || SettingsError.UPDATE_PASSWORD), () => SettingsError.UPDATE_PASSWORD);
          } else {
            // Update the password but don't bother re-encrypting the PAT since we are updating it anyway
            return this._sw.sendMessage(SwMessageType.SET_ENC_KEY, this.new_password).then(response => (response.data.status || SettingsError.PASSWORD), () => SettingsError.PASSWORD);
          }
        }
        return results;
      }).then(results => {
        // Update the PAT
        if (results === true && update_pat) {
          return this.updatePat().then(status => (status || SettingsError.PAT), () => SettingsError.PAT);
        }
        return results;
      }).then(results => {
        // Update the lock timer
        if (results === true && this.password_set) {
          return this.updateLockTimer().then(lock_result => (lock_result || SettingsError.LOCK_TIMER), () => SettingsError.LOCK_TIMER);
        }
        return results;
      }).then(results => {
        switch (results) {
          case true:
            this.settings.set('password_set', this.password_set);
            this.settings.save().then(() => {
              this.initializer.initApp();
              // Redirect to the main accounts page
              this.router.navigate(['/accounts']);
            });
            break;
          case SettingsError.SERVER_ACCESS:
            this.settings.set('host_url', old_url);
            this.settings.set('decoded_pat', old_pat);
            // Failed to load preferences, let the user know and stay on the settings page
            this.notifier.error("Couldn't connect to the specified server", 3000);
            break;
          case SettingsError.PASSWORD:
            // @ts-ignore
          case SettingsError.UPDATE_PASSWORD:
            this.password_set = false;
          default:
            console.log(results);
            this.notifier.error("Failed to save settings", 3000);
            break;
        }
      });
    }
  }

  /**
   * Update the stored Personal Access Token
   *
   * @private
   */
  private updatePat(): Promise<boolean> {
    return this._sw.sendMessage(SwMessageType.ENCRYPT_PAT, this.new_pat).then(cipher_text => {
      if (cipher_text.data.status) {
        this.settings.set("host_pat", cipher_text.data.host_pat);
        return this.settings.save().then(
          () => true,
          () => false
        );
      }

      return false;
    })
  }

  /**
   * Update the lock timer type
   *
   * @private
   */
  private updateLockTimer(): Promise<boolean> {
    this.lock_timer = this.lock_timer === 'null' ? null : this.lock_timer;
    if (this.lock_timer !== this.original_lock_timer) {
      return this._sw.sendMessage(SwMessageType.SET_LOCK_TYPE, this.lock_timer).then(
        status => true,
        () => false
      );
    } else {
      return new Promise(resolve => resolve(false));
    }
  }

  public clearStorage() {
    if (confirm("Reset extension storage?")) {
      localStorage.clear();
      storage.local.clear().then(() => {
        storage.sync.clear().then(() => {
          this._sw.sendMessage(SwMessageType.RESET_EXT).then(() => {
            this.initializer.initApp();
          });
        });
      })
    }
  }
}
