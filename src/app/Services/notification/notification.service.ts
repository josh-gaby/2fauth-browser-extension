import { Injectable } from '@angular/core';
import { Subject, Observable } from "rxjs";
import { Notification, NotificationType } from "../../Models/notifications";

@Injectable()
export class NotificationService {

  private _subject = new Subject<Notification>();
  private _idx = 0;

  constructor() { }

  getObservable(): Observable<Notification> {
    return this._subject.asObservable();
  }

  info(message: string, timeout = 3000) {
    this._subject.next(new Notification(this._idx++, NotificationType.info, message, timeout));
  }

  success(message: string, timeout = 3000) {
    this._subject.next(new Notification(this._idx++, NotificationType.success, message, timeout));
  }

  warning(message: string, timeout = 3000) {
    this._subject.next(new Notification(this._idx++, NotificationType.warning, message, timeout));
  }

  error(message: string, timeout = 0) {
    this._subject.next(new Notification(this._idx++, NotificationType.error, message, timeout));
  }
}
