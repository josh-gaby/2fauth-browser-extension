import { Injectable } from '@angular/core';
import { Subject, Observable } from "rxjs";
import { Notification, NotificationType } from "../../Models/notifications";

@Injectable()
export class NotificationService {

  private _subject = new Subject<Notification>();
  private _idx = 0;

  constructor() { }

  public getObservable(): Observable<Notification> {
    return this._subject.asObservable();
  }

  /**
   * Add an 'info' type notification
   *
   * @param message
   * @param timeout
   */
  public info(message: string, timeout = 3000) {
    this._subject.next(new Notification(this._idx++, NotificationType.info, message, timeout));
  }

  /**
   * Add an 'success' type notification
   *
   * @param message
   * @param timeout
   */
  public success(message: string, timeout = 3000) {
    this._subject.next(new Notification(this._idx++, NotificationType.success, message, timeout));
  }

  /**
   * Add an 'warning' type notification
   *
   * @param message
   * @param timeout
   */
  public warning(message: string, timeout = 3000) {
    this._subject.next(new Notification(this._idx++, NotificationType.warning, message, timeout));
  }

  /**
   * Add an 'error' type notification
   *
   * @param message
   * @param timeout
   */
  public error(message: string, timeout = 0) {
    this._subject.next(new Notification(this._idx++, NotificationType.error, message, timeout));
  }
}
