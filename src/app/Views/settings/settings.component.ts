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
import {InitCheckService} from "../../Services/initcheck/initcheck.service";
import {LocalSettingsService} from "../../Services/localsettings/localsettings.service";

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
  protected original_lock_type: number | null;
  protected disable_back: boolean = false;
  protected password_set: boolean = false;
  protected readonly faArrowLeftLong = faArrowLeftLong;

  constructor(private _sw: ServiceWorkerService,
              private api: ApiService,
              private initializer: InitCheckService,
              private local_settings: LocalSettingsService,
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
    this.lock_timer = this.local_settings.get('lock_timeout', null);
    this.original_lock_type = this.local_settings.get('lock_timeout', null);
    this.current_theme = this.local_settings.get('theme', "system");
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
    this.local_settings.set('theme', theme);
    this.local_settings.save();
    this.theme.setTheme(theme);
  }

  /**
   * Save the settings
   */
  public saveSettings(): void {
    let update_pat = false;
    this.settings.set('host_url', this.host_url);
    if (this.new_pat.length > 0) {
      update_pat = true;

    } else {
      this.settings.save();
    }

    // Only try redirect or load preferences if both a PAT and url are available
    if (this.settings.get("host_url") && (this.settings.get("host_pat") || (this.new_pat && this.new_pat.length > 0))) {
      // Store the old PAT so we can restore on failure
      let old_pat = this.settings.get("host_pat");
      this.settings.set('decoded_pat', this.new_pat);
      // We will try loading preferences
      this.preferences.updateFromServer().then(() => {
        // Preferences loaded successfully, now we can save the token
        this.api.invalid_token = false;
        if (update_pat) {
          this.updatePat().then(status => {
            if (status) {
              // Token has been saved, redirect to the main accounts page
              this.router.navigate(['/accounts']);
            } else {
              this.notifier.error("Failed to save your PAT", 3000);
            }
          })
        }
      },
      () => {
        this.settings.set('decoded_pat', old_pat);
        // Failed to load preferences, let the user know and stay on the settings page
        this.notifier.error("Couldn't connect to the specified server", 3000);
      });
    }
  }

  private updatePassword() {
    return this._sw.sendMessage(SwMessageType.CHANGE_ENC_KEY, this.new_password);
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
        return this.settings.save().then(() => true, () => false);
      }

      return false;
    })
  }

  private updateLockTimer(): Promise<boolean> {
    this.lock_timer = this.lock_timer === 'null' ? null : this.lock_timer;
    if (this.lock_timer !== this.original_lock_type) {
      return this._sw.sendMessage(SwMessageType.SET_LOCK_TYPE, this.lock_timer).then(status => {
        return true;
      })
    } else {
      return new Promise((resolve, reject) => {
        return resolve(false);
      });
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
