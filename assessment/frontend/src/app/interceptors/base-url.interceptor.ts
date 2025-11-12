import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class BaseUrlInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // If URL is already absolute (starts with http or //), don't modify
    const isAbsolute = /^(http|https):\/\//i.test(req.url) || /^\/\//.test(req.url);

    if (isAbsolute) {
      return next.handle(req);
    }

    // Prepend apiBase from environment (which should include the /api part)
    // Ensure we don't double-up slashes
    const base = environment.apiBase.replace(/\/$/, '');
    const path = req.url.replace(/^\//, '');
    const url = `${base}/${path}`;

    const cloned = req.clone({ url });
    return next.handle(cloned);
  }
}
