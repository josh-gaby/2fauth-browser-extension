import { Component } from '@angular/core';
import { NotificationService } from "../../Services/notification/notification.service";
import { Notification, NotificationType } from "../../Models/notifications";
import { Subscription } from "rxjs";

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {

  notification_list: Notification[] = [];
  private _subscription: Subscription | null = null;

  constructor(private notifications: NotificationService) {
  }

  private _addNotification(notification: Notification) {
    this.notification_list.push(notification);

    if (notification.timeout !== 0) {
      setTimeout(() => this.close(notification), notification.timeout);
    }
  }

  ngOnInit() {
    this._subscription = this.notifications.getObservable().subscribe(notification => this._addNotification(notification));
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe();
  }

  close(notification: Notification) {
    this.notification_list = this.notification_list.filter(notif => notif.id !== notification.id);
  }


  className(notification: Notification): string {

    let style: string;

    switch (notification.type) {

      case NotificationType.success:
        style = 'success';
        break;

      case NotificationType.warning:
        style = 'warning';
        break;

      case NotificationType.error:
        style = 'error';
        break;

      default:
        style = 'info';
        break;
    }

    return style;
  }
}
