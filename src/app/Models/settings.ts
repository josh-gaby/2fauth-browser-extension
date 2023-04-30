import {StorageObject} from "./storageobject";

export interface Settings {
  host_url: string;
  host_pat: string;
  theme: string;
}

export class SettingsClass extends StorageObject{
  override storeKey: string = '2fauth-app-settings';
  override data: Settings = {
    host_url: '',
    host_pat: '',
    theme: 'system'
  };
}
