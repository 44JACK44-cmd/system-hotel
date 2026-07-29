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
            if (res.data.email) this.storage.setItem('email', res.data.email);
            if (res.data.telefono) this.storage.setItem('telefono', res.data.telefono);
            if (res.data.fotoPerfil) this.storage.setItem('fotoPerfil', res.data.fotoPerfil);
            if (res.data.tema) {
              this.storage.setItem('tema', res.data.tema);
              document.documentElement.classList.toggle('dark', res.data.tema === 'DARK');
              document.documentElement.classList.toggle('light', res.data.tema === 'LIGHT');
            }
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

  getEmail(): string | null {
    return this.storage?.getItem('email') ?? null;
  }

  getTelefono(): string | null {
    return this.storage?.getItem('telefono') ?? null;
  }

  getFotoPerfil(): string | null {
    return this.storage?.getItem('fotoPerfil') ?? null;
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

  getTema(): string | null {
    return this.storage?.getItem('tema') ?? null;
  }

  setTema(tema: string): void {
    this.storage?.setItem('tema', tema);
  }

  actualizarPerfilSesion(usuario: { nombreCompleto?: string; email?: string; telefono?: string; fotoPerfil?: string }): void {
    if (!this.storage) return;
    if (usuario.nombreCompleto !== undefined) this.storage.setItem('nombreCompleto', usuario.nombreCompleto);
    if (usuario.email !== undefined) this.storage.setItem('email', usuario.email);
    if (usuario.telefono !== undefined) this.storage.setItem('telefono', usuario.telefono);
    if (usuario.fotoPerfil !== undefined) this.storage.setItem('fotoPerfil', usuario.fotoPerfil);
  }
}
