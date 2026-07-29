import { Injectable, NgZone } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

const T = () => performance.now().toFixed(2);

@Injectable()
export class ZoneHttpInterceptor implements HttpInterceptor {
  constructor(private ngZone: NgZone) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const reqId = (Math.random() * 10000).toFixed(0);
    const url = req.url.split('/').pop() || req.url;
    console.log(`[ZONE-INT] ${T()} REQ#${reqId} ${req.method} ${url} — intercept(), inAngularZone=${NgZone.isInAngularZone()}`);

    return new Observable(observer => {
      const sub = next.handle(req).subscribe({
        next: (event) => {
          if (event instanceof HttpResponse) {
            console.log(`[ZONE-INT] ${T()} REQ#${reqId} — next RECIBIDO, inAngularZone=${NgZone.isInAngularZone()}`);
          }
          this.ngZone.run(() => {
            observer.next(event);
          });
        },
        error: (err) => {
          console.log(`[ZONE-INT] ${T()} REQ#${reqId} — error RECIBIDO, inAngularZone=${NgZone.isInAngularZone()}`);
          this.ngZone.run(() => {
            observer.error(err);
          });
        },
        complete: () => {
          console.log(`[ZONE-INT] ${T()} REQ#${reqId} — complete()`);
          this.ngZone.run(() => {
            observer.complete();
          });
        }
      });
      return () => sub.unsubscribe();
    });
  }
}
