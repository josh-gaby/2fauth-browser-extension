import {Injectable} from "@angular/core";

@Injectable()
export class StorageObject {
  storeKey: string = '';
  data: any = [];
}
