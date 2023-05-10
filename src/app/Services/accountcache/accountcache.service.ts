import {Injectable, NgZone, Optional} from '@angular/core';
import {Account} from "../../Models/account";
import {AccountCacheClass} from "../../Models/accountcache";
import {ApiService} from "../api/api.service";
import {StorageService, StorageType} from "../storage/storage.service";
import {SwMessageType} from "../../Models/message";
import {ServiceWorkerService} from "../serviceworker/serviceworker.service";
import {take} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AccountCacheService extends StorageService {
  constructor(zone: NgZone,
              @Optional() _accounts: AccountCacheClass,
              private _api: ApiService,
              private _sw: ServiceWorkerService
  ) {
    let defaults = (_accounts)? _accounts : new AccountCacheClass();
    super(zone, defaults);
    this.setStorageType(StorageType.local);
  }

  /**
   * Update the cached list of Accounts from the server
   */
  update(): Promise<boolean> {
    return new Promise(resolve => {
      this._api.getAccounts().pipe(take(1)).subscribe(
        (accounts: Account[]) => {
          // Only update the stored data if the accounts list has changed
          let equal = this.data?.length === accounts.length && this.data?.every((o: Account, idx: number) => this.deepEqual(o, accounts[idx]));
          if (!equal) {
            this.data = accounts;
            this.saveToStorage(accounts).then(
              status => {
                resolve(status);
              },
              () => {
                resolve(false);
              }
            );
          }
          resolve(false)
        }
      );
    });
  }

  ngOnDestroy() {
    // Let the background worker know that we are closing
    this._sw.sendMessage(SwMessageType.EXT_CLOSING)
  }
}
