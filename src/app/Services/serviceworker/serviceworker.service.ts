import { Injectable } from '@angular/core';
import {from, Observable, of, Subject} from "rxjs";
import {Notification} from "../../Models/notifications";
import {SwMessage, SwMessageType} from "../../Models/message";
import {runtime} from "webextension-polyfill";

@Injectable({
  providedIn: 'root'
})
export class ServiceWorkerService {
  constructor() {}

  sendMessage(type: SwMessageType, payload: any = null): Promise<SwMessage> {
    let message = new SwMessage();
    message.name = type;
    try {
      return runtime.sendMessage({ type: type, payload: payload }).then(data => {
        message.data = data;
        return Promise.resolve(message);
      });
    } catch (error) {
      return Promise.resolve(message);
    }
  }
}
