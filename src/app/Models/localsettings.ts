import {StorageObject} from "./storageobject";

export interface LocalSettings {
  lock_timeout: number | null;
  theme: string;
}

export class LocalSettingsClass extends StorageObject{
  override storeKey: string = '2fauth-app-local-settings';
  override data: LocalSettings = {
    lock_timeout: null,
    theme: 'system'
  };
}
