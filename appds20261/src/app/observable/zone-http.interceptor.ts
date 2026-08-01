import { Injectable, NgZone } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ZoneHttpInterceptor implements HttpInterceptor {
  constructor(private ngZone: NgZone) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      const sub = next.handle(req).subscribe({
        next: (event) => {
          this.ngZone.run(() => {
            observer.next(event);
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            observer.error(err);
          });
        },
        complete: () => {
          this.ngZone.run(() => {
            observer.complete();
          });
        }
      });
      return () => sub.unsubscribe();
    });
  }
}
