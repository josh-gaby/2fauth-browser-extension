import {StorageObject} from "./storageobject";

export interface Settings {
  host_url: string;
  host_pat: string;
  decoded_pat: string;
  password_set: boolean;
  lock_timeout: number | null;
  theme: string;
}

export class SettingsClass extends StorageObject{
  override storeKey: string = '2fauth-app-settings';
  override data: Settings = {
    host_url: '',
    host_pat: '',
    decoded_pat: '',
    password_set: false,
    lock_timeout: null,
    theme: 'system'
  };
}
