import {Component, ElementRef, Renderer2, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";
import {faSun, faMoon, faDesktop, faArrowLeftLong, IconDefinition} from "@fortawesome/free-solid-svg-icons";
import {SettingsService} from "../../Services/settings/settings.service";
import {ThemingService} from "../../Services/theming/theming.service";
import {PreferencesService} from "../../Services/preferences/preferences.service";
import {NotificationService} from "../../Services/notification/notification.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent {
  protected host_url: string;
  protected host_pat: string;
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
    private preferences: PreferencesService,
    private notifier: NotificationService
  ) {
    this.disable_back = history.state?.data?.disable_back || false;
    this.host_url = this.settings.get("host_url", "");
    this.host_pat = this.settings.get("host_pat", "");
    this.current_theme = this.settings.get('theme', "system");
  }

  /**
   * Apply a theme
   *
   * @param theme
   */
  setTheme(theme: string): void {
    this.current_theme = theme;
    this.settings.set('theme', theme);
    this.settings.save();
    this.theme.setTheme(theme);
  }

  /**
   * Save the settings
   */
  saveSettings(): void {
    this.settings.set('host_url', this.host_url);
    this.settings.set('host_pat', this.host_pat);
    this.settings.save();
    // Only try redirect or load preferences if both a url and PAT is available
    if (this.settings.get("host_url") && this.settings.get("host_pat")) {
      // We will try loading preferences
      this.preferences.fromServer().then(() => {
        // Preferences loaded successfully, redirect to the main accounts page
        this.router.navigate(['/accounts']);
      },
      () => {
        // Failed to load preferences, let the user know
        this.notifier.error("Couldn't connect to the specified server", 3000);
      });
    }
  }
}
