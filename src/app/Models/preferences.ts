import {StorageObject} from "./storageobject";

export interface IPref {
  key: string;
  value: number;
}

export interface Preferences {
  lang: string,
  showOtpAsDot: boolean,
  closeOtpOnCopy: boolean,
  copyOtpOnDisplay: boolean,
  useBasicQrcodeReader: boolean,
  showAccountsIcons: boolean,
  displayMode: string,
  kickUserAfter: boolean,
  defaultGroup: string,
  useDirectCapture: boolean,
  defaultCaptureMode: string,
  rememberActiveGroup: boolean,
  getOfficialIcons: boolean,
  theme: string,
  formatPassword: boolean,
  formatPasswordBy: number
}
export class PreferencesClass implements StorageObject {
  storeKey: string = '2fauth-app-preferences';
  data: Preferences = {
    lang: 'en',
    showOtpAsDot: false,
    closeOtpOnCopy: false,
    copyOtpOnDisplay: false,
    useBasicQrcodeReader: false,
    showAccountsIcons: false,
    displayMode: '',
    kickUserAfter: false,
    defaultGroup: '',
    useDirectCapture: false,
    defaultCaptureMode: '',
    rememberActiveGroup: false,
    getOfficialIcons: false,
    theme: 'system',
    formatPassword: false,
    formatPasswordBy: 0.5
  };
}
