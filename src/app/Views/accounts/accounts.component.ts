import {Component, ViewEncapsulation} from '@angular/core';
import {ServerService} from "../../Services/server/server.service";
import {AppRoutingModule} from "../../app-routing.module";
import {Router} from "@angular/router";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import {faSpinner} from "@fortawesome/free-solid-svg-icons/faSpinner";
import {PreferencesService} from "../../Services/preferences/preferences.service";
import {SettingsService} from "../../Services/settings/settings.service";
import {AccountCacheService} from "../../Services/accountcache/accountcache.service";

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class AccountsComponent {
  protected readonly faGear = faGear;
  protected readonly faSpinner = faSpinner;

  constructor(private serverService: ServerService,
              private router: Router,
              public preferences: PreferencesService,
              public settings: SettingsService,
              public accounts_cache: AccountCacheService,
  ) {
    this.accounts_cache.update();
  }
}
