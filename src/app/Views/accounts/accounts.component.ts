import {Component, ViewEncapsulation} from '@angular/core';
import {PreferencesService} from "../../Services/preferences/preferences.service";
import {AccountCacheService} from "../../Services/accountcache/accountcache.service";
import { faGear, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';
import {Account} from "../../Models/account";

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class AccountsComponent {
  protected readonly faGear = faGear;
  protected readonly faSpinner = faSpinner;
  protected readonly faSearch = faSearch;
  public is_searching: boolean = false;
  public search: string  = '';
  public filtered_accounts:  Account[] = [];

  constructor(public preferences: PreferencesService,
              public accounts_cache: AccountCacheService,
  ) {
    // Update the account cache
    this.accounts_cache.update();
  }

  public filterAccounts() {
    this.is_searching = this.search.length > 0;
    console.log(this.search);
    this.filtered_accounts = [];
    for (let account of this.accounts_cache.data) {
      if (account.service.search(new RegExp(this.search, "i")) !== -1 || account.account.search(new RegExp(this.search, "i")) !== -1) {
        this.filtered_accounts.push(account);
      }
    }
  }
}
