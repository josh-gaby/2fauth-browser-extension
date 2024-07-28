import {Injectable} from '@angular/core';
import {SwMessage, SwMessageType} from "../../Models/message";
import {runtime} from "webextension-polyfill";

@Injectable({
  providedIn: 'root'
})
export class ServiceWorkerService {
  constructor() {}

  async sendMessage(type: SwMessageType, payload: any = null): Promise<SwMessage> {
    let message = new SwMessage();
    message.name = type;
    try {
      message.data = await runtime.sendMessage({type: type, payload: payload});
      return message;
    } catch (error) {
      return Promise.resolve(message);
    }
  }
}
