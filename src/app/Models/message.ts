export class SwMessage {
  name: string = '';
  data: any = null;
}

export enum SwMessageType {
  'GET_PAT' = 'GET-PAT',
  'SET_ENC_KEY' = 'SET-ENC-KEY',
  'UNLOCK' = 'UNLOCK-EXT',
  'SET_LOCK_TYPE' = 'SET-LOCK-TYPE',
  'EXT_CLOSING' = 'EXT-CLOSING',
  'CHECK_LOCKED' = 'CHECK-LOCKED',
  'ENCRYPT_PAT' = 'ENCRYPT-PAT',
  'RESET_EXT' = 'RESET-EXT',
  'CHANGE_ENC_KEY' = 'CHANGE-ENC-KEY'
}
