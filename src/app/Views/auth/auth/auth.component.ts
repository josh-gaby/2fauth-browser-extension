import {Component, ViewEncapsulation} from '@angular/core';
import {ServiceWorkerService} from "../../../Services/serviceworker/serviceworker.service";
import {SwMessageType} from "../../../Models/message";
import {SettingsService} from "../../../Services/settings/settings.service";
import {Router} from "@angular/router";
import {InitCheckService} from "../../../Services/initcheck/initcheck.service";
import {faUnlock} from "@fortawesome/free-solid-svg-icons/faUnlock";

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
              private initializer: InitCheckService,
              private settings: SettingsService,
              private router: Router
  ) {}

  unlock() {
    //if (this.enc_key && this.enc_key.length > 0) {
      this._sw.sendMessage(SwMessageType.SET_ENC_KEY, this.enc_key || '').then(response => {
        if (response.data.status == false) {
          // Invalid password, try again
          console.log('Failed to log in');
        } else {
          this.initializer.initApp();
        }
      });
    //}
  }
}
