import {Component, HostBinding} from '@angular/core';
import {Router} from "@angular/router";
import {ServerService} from "./Services/server/server.service";
import {Preferences} from "./Models/preferences";
import {PreferencesService} from "./Services/preferences/preferences.service";
import {SettingsService} from "./Services/settings/settings.service";
import {ThemingService} from "./Services/theming/theming.service";

@Component({
  selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '2FAuth';

  constructor(private router: Router,
              private serverService: ServerService,
              private preferences: PreferencesService,
              private settings: SettingsService,
              private theme: ThemingService) {
  }

  ngOnInit(): void {
    this.theme.setTheme(this.settings.get('theme'));
    if (this.settings.get("host_url") === '' || this.settings.get("host_pat") === '') {
      // Missing the host URL or PAT, display the settings page so that they can be entered
      this.router.navigate(['/settings']);
    } else {
      // Load the current user preferences from the server
      this.preferences.fromServer();
    }
  }
}
