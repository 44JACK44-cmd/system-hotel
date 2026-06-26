import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../api/environment';
import { LoginRequest, LoginResponse, GenericResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: object) {}

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.localStorage : null;
  }

  login(data: LoginRequest): Observable<GenericResponse<LoginResponse>> {
    return this.http.post<any>(`${this.API}/login`, data)
      .pipe(
        map(r => toGenericResponse<LoginResponse>(r, 'loginResponse')),
        tap(res => {
          if (res.success && res.data && this.storage) {
            this.storage.setItem('token', res.data.token);
            this.storage.setItem('username', res.data.username);
            this.storage.setItem('nombreCompleto', res.data.nombreCompleto);
            this.storage.setItem('rol', res.data.rol);
            this.storage.setItem('userId', res.data.userId.toString());
          }
        })
      );
  }

  logout(): void {
    this.storage?.clear();
  }

  isLoggedIn(): boolean {
    return !!this.storage?.getItem('token');
  }

  getToken(): string | null {
    return this.storage?.getItem('token') ?? null;
  }

  getRol(): string | null {
    return this.storage?.getItem('rol') ?? null;
  }

  getUsername(): string | null {
    return this.storage?.getItem('username') ?? null;
  }

  getNombreCompleto(): string | null {
    return this.storage?.getItem('nombreCompleto') ?? null;
  }

  getUserId(): number {
    return parseInt(this.storage?.getItem('userId') || '0', 10);
  }

  isAdmin(): boolean {
    return this.getRol() === 'ADMIN';
  }

  isRecepcionista(): boolean {
    return this.getRol() === 'RECEPCIONISTA';
  }
}
