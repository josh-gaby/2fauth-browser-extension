import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import {SettingsService} from "../Services/settings/settings.service";

@Injectable({
  providedIn: 'root',
})
export class TokenInterceptorService implements HttpInterceptor {
  constructor(private settings: SettingsService) {}

  /**
   * Intercept all HTTP request so we can inject the Authorization header
   *
   * @param request
   * @param next
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let pat = this.settings.get('host_pat');
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
        if (err.status === 401) {
          // Unauthorized, do something about it
        }
        const error = err.error.message || err.statusText;
        return throwError(error);
      })
    );
  }
}
