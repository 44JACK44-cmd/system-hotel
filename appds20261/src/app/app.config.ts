import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

const HotelPreset = definePreset(Aura, {
  components: {
    datepicker: {
      dropdown: {
        color: '#44474e',
        hoverColor: '#44474e',
        activeColor: '#44474e'
      }
    }
  },
  semantic: {
    primary: {
      50:  '#eef4ff',
      100: '#dbeafe',
      200: '#bed9ff',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#055db6',
      800: '#003670',
      900: '#002046',
      950: '#001230'
    },
    colorScheme: {
      light: {
        primary: {
          color:         '{primary.700}',
          hoverColor:    '{primary.800}',
          activeColor:   '{primary.900}'
        },
        surface: {
          0: '#ffffff',
          50: '#faf9fd',
          100: '#f4f3f7',
          200: '#efedf1',
          300: '#e9e7eb',
          400: '#e3e2e6',
          500: '#c4c6cf',
          600: '#74777f',
          700: '#44474e',
          800: '#1a1b1e',
          900: '#1a1b1e'
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.700} 12%, transparent)',
          focusBackground: 'color-mix(in srgb, {primary.700} 20%, transparent)',
          color: '{primary.700}',
          focusColor: '{primary.700}'
        }
      },
      dark: {
        primary: {
          color:         '{primary.700}',
          hoverColor:    '{primary.800}',
          activeColor:   '{primary.900}'
        },
        surface: {
          0: '#ffffff',
          50: '#faf9fd',
          100: '#f4f3f7',
          200: '#efedf1',
          300: '#e9e7eb',
          400: '#e3e2e6',
          500: '#c4c6cf',
          600: '#74777f',
          700: '#44474e',
          800: '#1a1b1e',
          900: '#1a1b1e'
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.700} 12%, transparent)',
          focusBackground: 'color-mix(in srgb, {primary.700} 20%, transparent)',
          color: '{primary.700}',
          focusColor: '{primary.700}'
        },
        datepicker: {
          dropdown: {
            color: '#44474e',
            hoverColor: '#44474e',
            activeColor: '#44474e'
          }
        }
      }
    }
  }
});

import { routes } from './app.routes';
import { AuthInterceptor } from './observable/auth.interceptor';
import { ZoneHttpInterceptor } from './observable/zone-http.interceptor';

import { MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: false, runCoalescing: false }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: HotelPreset,
        options: { cssLayer: false }
      },
      overlayAppendTo: 'body',
      zIndex: { modal: 1100, overlay: 1000, menu: 1000, tooltip: 1000 },
      overlayOptions: { autoZIndex: true },
      inputVariant: 'outlined'
    }),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ZoneHttpInterceptor, multi: true },
    MessageService
  ]
};
