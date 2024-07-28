import { Injectable } from '@angular/core';
import {catchError} from 'rxjs/operators';
import {Observable, throwError} from 'rxjs';
import {HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse} from '@angular/common/http';
import {SettingsService} from "../Services/settings/settings.service";
import {Router} from "@angular/router";
import {NotificationService} from "../Services/notification/notification.service";
import {ApiService} from "../Services/api/api.service";

@Injectable({
  providedIn: 'root',
})
export class TokenInterceptorService implements HttpInterceptor {
  constructor(private settings: SettingsService, private router: Router, private notifier: NotificationService, private api: ApiService) {}

  /**
   * Intercept all HTTP request so that we can inject the Authorization header and cache images
   *
   * @param request
   * @param next
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let pat = this.settings.get('decoded_pat');
    if (pat) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${pat}`,
          'Content-Type': 'application/json',
        },
      });
    }
    return next.handle(request).pipe(
      catchError((err) => {
        if (err.status === 401 || err.status === 403) {
          this.notifier.error("Invalid Personal Access Token", 3000);
          this.api.invalid_token = true;
          this.router.navigate(['/settings/account'], { state: { data: {disable_back: true} } });
        }
        if (err.status === 404) {
          this.notifier.warning("Account missing");
          this.router.navigate(['/accounts']);
        }
        const error = err.error.message || err.statusText;
        return throwError(error);
      })
    );
  }
}
