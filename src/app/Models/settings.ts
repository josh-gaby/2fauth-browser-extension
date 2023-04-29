import {StorageObject} from "./storageobject";

export interface Settings {
  host_url: string;
  host_pat: string;
  theme: string;
}

export class SettingsClass implements StorageObject{
  storeKey: string = '2fauth-app-settings';
  data: Settings = {
    host_url: '',
    host_pat: '',
    theme: 'system'
  };
}
