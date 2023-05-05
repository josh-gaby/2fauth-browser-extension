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
import {extension, runtime} from "webextension-polyfill";
import {InitializerService} from "./Services/initializer/initializer.service";

@Component({
  selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '2FAuth';
  private _subscription: Subscription | null = null;

  constructor(private initializer: InitializerService,
              private router: Router,
              private _sw: ServiceWorkerService,
  ) {
    // Open a port so that the background worker can detect when the extension is closing
    runtime.connect();

    // Check if the extension has been locked
    this._sw.sendMessage(SwMessageType.CHECK_LOCKED).then(response => {
      if (response.data.locked === true) {
        console.log('redirect from app.component');
        // Its locked, redirect to the auth screen
        this.router.navigate(['/auth']);
      } else {
        this.initializer.initApp();
      }
    });
  }
}
