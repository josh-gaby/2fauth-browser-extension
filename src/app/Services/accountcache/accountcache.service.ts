import {Injectable, NgZone, Optional} from '@angular/core';
import {Account} from "../../Models/account";
import {AccountCacheClass} from "../../Models/accountcache";
import {Preferences, PreferencesClass} from "../../Models/preferences";
import {ServerService} from "../server/server.service";
import {SettingsService} from "../settings/settings.service";
import {StorageService} from "../storage/storage.service";
import {SettingsClass} from "../../Models/settings";

@Injectable({
  providedIn: 'root'
})
export class AccountCacheService extends StorageService {
  constructor(zone: NgZone, @Optional() _accounts: AccountCacheClass, private serverService: ServerService) {
    super(zone);
    let defaults = (_accounts)? _accounts : {storeKey: '', data: []};
    this.data = defaults.data;
    this.storeKey = defaults.storeKey;
  }

  /**
   * Update the cached list of Accounts from the server
   */
  update(): void {
    this.serverService.twofaccounts().subscribe((accounts: Account[]) => {
      this.data = accounts;
      this.setAll(this.data, this.storeKey);
    });
  }
}
