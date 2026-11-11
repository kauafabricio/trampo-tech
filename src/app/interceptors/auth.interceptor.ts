import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('trampotech_token') : null;

  let headers = req.headers;
  if (token && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const clonedReq = req.clone({
    headers,
    withCredentials: true
  });

  return next(clonedReq);
};
