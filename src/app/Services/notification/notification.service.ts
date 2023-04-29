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

  /**
   * Add an 'info' type notification
   *
   * @param message
   * @param timeout
   */
  info(message: string, timeout = 3000) {
    this._subject.next(new Notification(this._idx++, NotificationType.info, message, timeout));
  }

  /**
   * Add an 'success' type notification
   *
   * @param message
   * @param timeout
   */
  success(message: string, timeout = 3000) {
    this._subject.next(new Notification(this._idx++, NotificationType.success, message, timeout));
  }

  /**
   * Add an 'warning' type notification
   *
   * @param message
   * @param timeout
   */
  warning(message: string, timeout = 3000) {
    this._subject.next(new Notification(this._idx++, NotificationType.warning, message, timeout));
  }

  /**
   * Add an 'error' type notification
   *
   * @param message
   * @param timeout
   */
  error(message: string, timeout = 0) {
    this._subject.next(new Notification(this._idx++, NotificationType.error, message, timeout));
  }
}
