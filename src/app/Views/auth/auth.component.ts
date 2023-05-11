import {Component, ViewEncapsulation} from '@angular/core';
import {ServiceWorkerService} from "../../Services/serviceworker/serviceworker.service";
import {SwMessageType} from "../../Models/message";
import {SettingsService} from "../../Services/settings/settings.service";
import {Router} from "@angular/router";
import {InitializerService} from "../../Services/initializer/initializer.service";
import {faUnlock} from "@fortawesome/free-solid-svg-icons/faUnlock";
import {NotificationService} from "../../Services/notification/notification.service";
import {LoaderService} from "../../Services/loader/loader.service";

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthComponent {
  public enc_key: string = '';
  protected readonly faUnlock = faUnlock;
  constructor(private _sw: ServiceWorkerService,
              private initializer: InitializerService,
              private loader: LoaderService,
              private notifier: NotificationService,
              private settings: SettingsService,
              private router: Router
  ) {}

  unlock() {
    if (this.enc_key && this.enc_key.length > 0) {
      this.loader.showLoader();
      this._sw.sendMessage(SwMessageType.SET_ENC_KEY, this.enc_key).then(response => {
        if (response.data.status) {
          this._sw.sendMessage(SwMessageType.UNLOCK).then(response => {
            if (response.data.status) {
              this.initializer.initApp();
            } else {
              this.handleFailedLogin();
            }
          })
        } else {
          this.handleFailedLogin();
        }
      });
    }
  }

  handleFailedLogin() {
    this.loader.hideLoader();
    this.notifier.error('Authentication failed.', 3000)
  }
}
