import {Component, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";
import {faChevronLeft} from "@fortawesome/free-solid-svg-icons";
import {SettingsService} from "../../../Services/settings/settings.service";
import {PreferencesService} from "../../../Services/preferences/preferences.service";
import {NotificationService} from "../../../Services/notification/notification.service";
import {ApiService} from "../../../Services/api/api.service";
import {ServiceWorkerService} from "../../../Services/serviceworker/serviceworker.service";
import {SwMessageType} from "../../../Models/message";
import {storage} from "webextension-polyfill";
import {InitializerService} from "../../../Services/initializer/initializer.service";
import {AccountCacheService} from "../../../Services/accountcache/accountcache.service";
import {SettingsClass} from "../../../Models/settings";
import {PreferencesClass} from "../../../Models/preferences";
import {LoaderService} from "../../../Services/loader/loader.service";

enum SettingsError {
  SERVER_ACCESS = -1,
  PASSWORD = -2,
  PAT = -3,
  LOCK_TIMER = -4,
  UPDATE_PASSWORD = -5
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.account.component.html',
  styleUrls: ['../settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsAccountComponent {
  protected host_url: string;
  private host_pat: string;
  public have_pat: boolean = false;
  public starred_pat: string = '';
  protected new_pat: string = '';
  public starred_pass: string = '';
  protected new_password: string = '';
  protected lock_timer: number | string | null;
  protected original_lock_timer: number | null;
  protected disable_back: boolean = false;
  protected password_set: number | boolean = false;
  protected readonly faChevronLeft = faChevronLeft;

  constructor(private _sw: ServiceWorkerService,
              private account_cache: AccountCacheService,
              private api: ApiService,
              private initializer: InitializerService,
              private loader: LoaderService,
              private notifier: NotificationService,
              private preferences: PreferencesService,
              private router: Router,
              public settings: SettingsService,
  ) {
    this.disable_back = history.state?.data?.disable_back || false;
    this.host_url = this.settings.get("host_url", "");
    this.host_pat = this.settings.get("decoded_pat", "");
    this.password_set = this.settings.get("password_set", false);
    this.have_pat = this.host_pat.length > 0;
    this.starred_pat = this.getStarredPat();
    this.starred_pass = '*'.repeat(this.password_set as number);
    this.lock_timer = this.settings.get('lock_timeout', null);
    this.original_lock_timer = this.settings.get('lock_timeout', null);
  }

  /**
   * Get a starred version of the PAT
   *
   * @private
   */
  private getStarredPat(): string {
    let length = this.host_pat.length;
    if (length === 0) {
      return '';
    }
    let start_end_length = length > 100 ? 20 : (length > 50 ? 15 : (length > 20 ? 5 : 1));
    return this.host_pat.substring(0, start_end_length) + '*'.repeat(Math.min(280, this.host_pat.length - (start_end_length * 2))) + this.host_pat.substring(this.host_pat.length - start_end_length);
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

    if (update_pat) {
      this.settings.set('decoded_pat', this.new_pat);
      this.api.invalid_token = false;
    }

    // Test the provided server details
    this.loader.showLoader();
    this.api.checkAccess().then(
      results => {
        return (results || SettingsError.SERVER_ACCESS)
      },
      () => {
        return SettingsError.SERVER_ACCESS
      }
    ).then(
      results => {
      // Update the password
      if (results === true && update_password) {
        return this.updatePassword(update_pat);
      }
      return results;
    }).then(results => {
      // Update the PAT
      if (results === true && update_pat) {
        return this.updatePat();
      }
      return results;
    }).then(results => {
      // Update the lock timer
      if (results === true && this.password_set !== false) {
        return this.updateLockTimer();
      }
      return results;
    }).then(results => {
      switch (results) {
        case true:
          this.settings.set('password_set', this.password_set);
          this.settings.save().then(() => {
            if (this.host_url !== old_url || update_pat) {
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
          this.loader.hideLoader();
          this.settings.set('host_url', old_url);
          this.settings.set('decoded_pat', old_pat);
          // Failed to load preferences, let the user know and stay on the settings page
          this.notifier.error("Couldn't connect to the specified server", 3000);
          break;
        case SettingsError.PASSWORD:
          // @ts-ignore
        case SettingsError.UPDATE_PASSWORD: // NOSONAR
          this.password_set = false;
        default:
          this.loader.hideLoader();
          this.notifier.error("Failed to save settings", 3000);
          break;
      }
    });
  }

  public passwordChanged() {
    this.password_set = this.new_password.length || false;
  }

  /**
   * Update the password
   * @param update_pat
   * @private
   */
  private updatePassword(update_pat: boolean) {
    this.password_set = this.new_password.length;
    if (!update_pat) {
      // Update the password and re-encrypt the current PAT using the key
      return this._sw.sendMessage(SwMessageType.CHANGE_ENC_KEY, this.new_password).then(
        cipher_text => {
            if (cipher_text.data.status) {
              return this.savePat(cipher_text.data.host_pat).then(status => (status || SettingsError.UPDATE_PASSWORD), () => SettingsError.UPDATE_PASSWORD);
            }
            return SettingsError.UPDATE_PASSWORD
        },
        () => SettingsError.UPDATE_PASSWORD
      );
    } else {
      // Update the password but don't bother re-encrypting the PAT since we are updating it anyway
      return this._sw.sendMessage(SwMessageType.SET_ENC_KEY, this.new_password).then(
        cipher_text => {
          if (cipher_text.data.status) {
            return this.savePat(cipher_text.data.host_pat).then(status => (status || SettingsError.PASSWORD), () => SettingsError.PASSWORD);
          }
          return SettingsError.PASSWORD
        },
        () => SettingsError.PASSWORD
      );
    }
  }

  private savePat(new_cipher_text: any) {
    this.settings.set("host_pat", new_cipher_text);
    return this.settings.save().then(
      () => true,
      () => false
    );
  }

  /**
   * Update the stored Personal Access Token
   *
   * @private
   */
  private async updatePat(): Promise<boolean|SettingsError> {
    const cipher_text = await this._sw.sendMessage(SwMessageType.ENCRYPT_PAT, this.new_pat);
    if (cipher_text.data.status) {
      return this.savePat(cipher_text.data.host_pat).then(
        status => {
          return this._sw.sendMessage(SwMessageType.UNLOCK).then(
            unlocked => (status || SettingsError.PAT),
            () => SettingsError.PAT
          );
        },
        () => SettingsError.PAT
      );
    }
    return SettingsError.PAT;
  }

  /**
   * Update the lock timer type
   *
   * @private
   */
  private updateLockTimer():Promise<any> {
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
