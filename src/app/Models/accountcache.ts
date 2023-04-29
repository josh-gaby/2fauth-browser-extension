import {Account} from "./account";
import {StorageObject} from "./storageobject";
export class AccountCacheClass implements StorageObject {
  storeKey: string = '2fauth-app-accounts';
  data: Account[] = [];
}
