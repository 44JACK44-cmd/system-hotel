import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../api/environment';
import { AuthService } from '../observable/auth.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'hs-theme';
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private _dark = signal<boolean>(this.loadPreference());

  readonly isDark = computed(() => this._dark());

  constructor() {
    this.applyTheme(this._dark());
  }

  setTheme(dark: boolean): void {
    this._dark.set(dark);
    this.applyTheme(dark);
    this.savePreference(dark);
    const userId = this.authService.getUserId();
    if (userId) {
      this.http.patch(`${environment.apiUrl}/usuario/tema/${userId}`, { tema: dark ? 'DARK' : 'LIGHT' }).subscribe({
        next: (res: any) => {
          if (res?.listUsuario?.[0]?.tema) {
            this.authService.setTema(res.listUsuario[0].tema);
          }
        }
      });
    }
  }

  toggle(): void {
    this.setTheme(!this._dark());
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
  }

  private loadPreference(): boolean {
    const storedTema = this.authService.getTema();
    if (storedTema === 'DARK') return true;
    if (storedTema === 'LIGHT') return false;
    return localStorage.getItem(this.STORAGE_KEY) === 'dark';
  }

  private savePreference(dark: boolean): void {
    localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
  }
}
