import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api')) {
    const token = sessionStorage.getItem('access_token');
    const headers = token
      ? req.headers.set('Authorization', `Bearer ${token}`)
      : req.headers;
    req = req.clone({ withCredentials: true, headers });
  }
  return next(req);
};
