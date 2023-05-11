import {StorageObject} from "./storageobject";

export interface Settings {
  host_url: string;
  lock_timeout: number | null;
  theme: string;
  client_id: string | null;
  client_secret: string | null;
  username: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expiry_time: number | null;
  locked: boolean;
}

export class SettingsClass extends StorageObject{
  override storeKey: string = '2fauth-app-settings';
  override data: Settings = {
    host_url: '',
    lock_timeout: null,
    theme: 'system',
    client_id: null,
    client_secret: null,
    username: null,
    access_token: null,
    refresh_token: null,
    expiry_time: null,
    locked: false
  };
}
