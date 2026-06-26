import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { AuthInterceptor } from './observable/auth.interceptor';

import { MessageService } from 'primeng/api';
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    providePrimeNG({ theme: { preset: Aura } }),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    MessageService
  ]
};
