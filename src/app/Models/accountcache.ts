import {Account} from "./account";
import {StorageObject} from "./storageobject";
export class AccountCacheClass extends StorageObject {
  override storeKey: string = '2fauth-app-accounts';
  override data: Account[] = [];
}
