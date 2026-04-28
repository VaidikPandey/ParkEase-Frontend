import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const http = inject(HttpClient);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (err.status === 401 && refreshToken && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        return http.post<any>('/api/v1/auth/refresh', {}, {
          headers: { 'X-Refresh-Token': refreshToken }
        }).pipe(
          switchMap(res => {
            localStorage.setItem('access_token', res.accessToken);
            auth.token.set(res.accessToken);
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } });
            return next(retried);
          }),
          catchError(() => { auth.logout(); return throwError(() => err); })
        );
      }
      return throwError(() => err);
    })
  );
};
