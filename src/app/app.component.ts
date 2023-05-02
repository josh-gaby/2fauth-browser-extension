import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {PreferencesService} from "./Services/preferences/preferences.service";
import {SettingsService} from "./Services/settings/settings.service";
import {ThemingService} from "./Services/theming/theming.service";
import {ApiService} from "./Services/api/api.service";
import {NotificationService} from "./Services/notification/notification.service";
import {ServiceWorkerService} from "./Services/serviceworker/serviceworker.service";
import {Subscription} from "rxjs";
import {SwMessageType} from "./Models/message";

@Component({
  selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '2FAuth';
  private _subscription: Subscription | null = null;

  constructor(private api: ApiService,
              private notifier: NotificationService,
              private preferences: PreferencesService,
              private router: Router,
              private settings: SettingsService,
              private theme: ThemingService,
              private _sw: ServiceWorkerService) {
    // Let the background worker know we are closing
    window.addEventListener("unload", () => {
      this._sw.sendMessage(SwMessageType.EXT_CLOSING);
    });

    // Check if the extension has been locked
    this._sw.sendMessage(SwMessageType.CHECK_LOCKED).then(response => {
      if (response.data.locked === true) {
        // Its locked, redirect to the auth screen
        this.router.navigate(['/auth']);
      } else {
        // Temporary, ask the worker to retrieve the PAT (this is only needed until the auth screen and encode/decode is setup)
        this._sw.sendMessage(SwMessageType.SET_ENC_KEY, "#jZ7765#").then(() => {
          // Its not locked, request the PAT from the background worker
          this._sw.sendMessage(SwMessageType.GET_PAT).then(response => {
            this.settings.set('decoded_pat', response.data.pat);
            if (!this.settings.get("host_url") || !this.settings.get("host_url")) {
              // Missing the host URL or PAT, display the settings page so that they can be entered
              this.router.navigate(['/settings'], {state: {data: {disable_back: true}}});
            } else if (this.api.invalid_token) {
              this.notifier.error("Invalid Personal Access Token", 3000);
              this.router.navigate(['/settings'], {state: {data: {disable_back: true}}});
            } else {
              // Load the current user preferences from the server
              this.preferences.updateFromServer();
              this.theme.setTheme(this.settings.get('theme'));
              // Redirect to the accounts page
              this.router.navigate(['/accounts']);
            }
          });
        });
      }
    });
  }
}
