import {Component, ViewEncapsulation} from '@angular/core';
import {AppRoutingModule} from "../../app-routing.module";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import {faSpinner} from "@fortawesome/free-solid-svg-icons/faSpinner";
import {PreferencesService} from "../../Services/preferences/preferences.service";
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

  constructor(public preferences: PreferencesService,
              public accounts_cache: AccountCacheService,
  ) {
    // Update the account cache
    this.accounts_cache.update();
  }
}
