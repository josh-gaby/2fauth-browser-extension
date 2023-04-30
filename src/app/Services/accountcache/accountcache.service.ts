import {Injectable, NgZone, Optional} from '@angular/core';
import {Account} from "../../Models/account";
import {AccountCacheClass} from "../../Models/accountcache";
import {Preferences, PreferencesClass} from "../../Models/preferences";
import {ServerService} from "../server/server.service";
import {SettingsService} from "../settings/settings.service";
import {StorageService, StorageType} from "../storage/storage.service";
import {SettingsClass} from "../../Models/settings";

@Injectable({
  providedIn: 'root'
})
export class AccountCacheService extends StorageService {
  constructor(zone: NgZone, @Optional() _accounts: AccountCacheClass, private serverService: ServerService) {
    let defaults = (_accounts)? _accounts : new AccountCacheClass();
    super(zone, defaults);
    this.setStorageType(StorageType.local);
  }

  /**
   * Update the cached list of Accounts from the server
   */
  update(): void {
    this.serverService.twofaccounts().subscribe((accounts: Account[]) => {
      // Only update the stored data if the accounts list has changed
      let equal = this.data.length === accounts.length && this.data.every((o: Account, idx: number) => this.objectsEqual(o, accounts[idx]));
      if (!equal) {
        this.data = accounts;
        this.saveToStorage();
      }
    });
  }
}
