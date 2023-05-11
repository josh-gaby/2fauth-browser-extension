import {Component, ViewEncapsulation} from '@angular/core';
import {ServiceWorkerService} from "../../Services/serviceworker/serviceworker.service";
import {SwMessageType} from "../../Models/message";
import {SettingsService} from "../../Services/settings/settings.service";
import {Router} from "@angular/router";
import {InitializerService} from "../../Services/initializer/initializer.service";
import {faUnlock} from "@fortawesome/free-solid-svg-icons/faUnlock";
import {NotificationService} from "../../Services/notification/notification.service";
import {ApiService} from "../../Services/api/api.service";

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthComponent {
  public password: string = '';
  protected readonly faUnlock = faUnlock;
  constructor(private _sw: ServiceWorkerService,
              private api: ApiService,
              private initializer: InitializerService,
              private notifier: NotificationService,
              private settings: SettingsService,
              private router: Router
  ) {}

  unlock() {
    if (this.password && this.password.length > 0) {
      this.api.requestAccessToken(this.password).then(response => {
        if (response) {
          this.settings.set('locked', false);
          this.settings.save().then(response => {
            this._sw.sendMessage(SwMessageType.UNLOCK).then(response => {
              this.initializer.initApp();
            });
          })
        } else {
          this.handleFailedLogin();
        }
      });
    }
  }

  handleFailedLogin() {
    this.notifier.error('Authentication failed.', 3000)
  }
}
