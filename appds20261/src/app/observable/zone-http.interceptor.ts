import { Injectable, NgZone } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ZoneHttpInterceptor implements HttpInterceptor {
  constructor(private ngZone: NgZone) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      const sub = next.handle(req).subscribe({
        next: (event) => this.ngZone.run(() =>
          Promise.resolve().then(() => observer.next(event))
        ),
        error: (err) => this.ngZone.run(() =>
          Promise.resolve().then(() => observer.error(err))
        ),
        complete: () => this.ngZone.run(() =>
          Promise.resolve().then(() => observer.complete())
        )
      });
      return () => sub.unsubscribe();
    });
  }
}
