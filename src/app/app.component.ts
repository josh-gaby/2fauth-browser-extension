import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {ServiceWorkerService} from "./Services/serviceworker/serviceworker.service";
import {SwMessageType} from "./Models/message";
import {runtime} from "webextension-polyfill";
import {InitializerService} from "./Services/initializer/initializer.service";
import {SettingsClass} from "./Models/settings";
import {SettingsService} from "./Services/settings/settings.service";

@Component({
  selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '2FAuth';

  constructor(private initializer: InitializerService,
              private router: Router,
              private settings: SettingsService,
              private _sw: ServiceWorkerService,
  ) {
    // Open a port so that the background worker can detect when the extension is closing
    runtime.connect();

    // Check if the extension has been locked
    if (this.settings.get('locked') === true) {
      // Its locked, redirect to the auth screen
      this.router.navigate(['/auth']);
    } else {
      this.initializer.initApp();
    }
  }
}
