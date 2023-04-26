import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TokenInterceptorService implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let pat = localStorage.getItem('pat');
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
