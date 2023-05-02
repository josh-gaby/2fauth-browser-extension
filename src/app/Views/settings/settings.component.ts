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
  protected themes = [
    { text: 'Light', value: 'light', icon: faSun },
    { text: 'Dark', value: 'dark', icon: faMoon },
    { text: 'Auto', value: 'system', icon: faDesktop },
  ];
  protected current_theme: string;
  protected disable_back: boolean = false;
  protected readonly faArrowLeftLong = faArrowLeftLong;

  constructor(private router: Router,
              public settings: SettingsService,
              private theme: ThemingService,
              private api: ApiService,
              private preferences: PreferencesService,
              private notifier: NotificationService,
              private _sw: ServiceWorkerService
  ) {
    this.disable_back = history.state?.data?.disable_back || false;
    this.host_url = this.settings.get("host_url", "");
    this.host_pat = this.settings.get("decoded_pat", "");
    this.have_pat = this.host_pat.length > 0;
    this.starred_pat = this.getStarredPat();
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
    this.settings.set('host_url', this.host_url);
    console.log(this.new_pat);
    if (this.new_pat.length > 0) {
      this.api.invalid_token = false;
      this.settings.set('decoded_pat', this.new_pat);
      this._sw.sendMessage(SwMessageType.ENCRYPT_PAT).then(cipher_text => {
        console.log(cipher_text);
        if (cipher_text.data.status) {
          this.settings.set("host_pat", `enc-${cipher_text.data.host_pat}`);
          this.settings.save();
        }
      })
    } else {
      this.settings.save();
    }

    // Only try redirect or load preferences if both a PAT and url are available
    if (this.settings.get("host_url") && this.settings.get("host_pat")) {
      // We will try loading preferences
      this.preferences.updateFromServer().then(() => {
        // Preferences loaded successfully, redirect to the main accounts page
        this.router.navigate(['/accounts']);
      },
      () => {
        // Failed to load preferences, let the user know and stay on the settings page
        this.notifier.error("Couldn't connect to the specified server", 3000);
      });
    }
  }
}
