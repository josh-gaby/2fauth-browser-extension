import {Component, HostBinding} from '@angular/core';
import {Router} from "@angular/router";
import {Preferences} from "./Models/preferences";
import {PreferencesService} from "./Services/preferences/preferences.service";
import {SettingsService} from "./Services/settings/settings.service";
import {ThemingService} from "./Services/theming/theming.service";
import {ApiService} from "./Services/api/api.service";
import {NotificationService} from "./Services/notification/notification.service";

@Component({
  selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '2FAuth';

  constructor(private api: ApiService,
              private notifier: NotificationService,
              private preferences: PreferencesService,
              private router: Router,
              private settings: SettingsService,
              private theme: ThemingService) {
    if (!this.settings.get("host_url") || !this.settings.get("host_pat")) {
      // Missing the host URL or PAT, display the settings page so that they can be entered
      this.router.navigate(['/settings'], { state: { data: {disable_back: true} } });
    } else if (this.api.invalid_token) {
      this.notifier.error("Invalid Personal Access Token", 3000);
      this.router.navigate(['/settings'], { state: { data: {disable_back: true} } });
    } else {
      // Load the current user preferences from the server
      this.preferences.updateFromServer();
      this.theme.setTheme(this.settings.get('theme'));
    }
  }
}
