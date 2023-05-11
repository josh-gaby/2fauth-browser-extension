export class SwMessage {
  name: string = '';
  data: any = null;
}

export enum SwMessageType {
  'UNLOCK' = 'UNLOCK-EXT',
  'SET_LOCK_TYPE' = 'SET-LOCK-TYPE',
  'EXT_CLOSING' = 'EXT-CLOSING',
  'RESET_EXT' = 'RESET-EXT'
}
