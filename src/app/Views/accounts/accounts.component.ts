import {Component, ViewEncapsulation} from '@angular/core';
import {ServerService} from "../../Services/server/server.service";
import {Account} from "../../Models/account";
import {AppRoutingModule} from "../../app-routing.module";
import {Router} from "@angular/router";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import {PreferencesService} from "../../Services/preferences/preferences.service";
import {SettingsService} from "../../Services/settings/settings.service";
import {faSpinner} from "@fortawesome/free-solid-svg-icons/faSpinner";
import {count} from "rxjs";

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AccountsComponent {
  public faGear = faGear;
  public accounts: Account[] = [];
  public icon_url: string;
  protected readonly faSpinner = faSpinner;

  constructor(private serverService: ServerService, private router: Router, public preferences: PreferencesService, public settings: SettingsService) {
    this.icon_url = this.settings.get('host_url') + '/storage/icons/';
    this.getAccounts();
  }

  getAccounts(): void {
    this.serverService.twofaccounts().subscribe((accounts: Account[]) => this.accounts = accounts);
  }
}
