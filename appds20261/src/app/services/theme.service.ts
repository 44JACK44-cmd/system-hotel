import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'hs-theme';
  private _dark = signal<boolean>(this.loadPreference());

  readonly isDark = computed(() => this._dark());

  constructor() {
    this.applyTheme(this._dark());
  }

  toggle(): void {
    const next = !this._dark();
    this._dark.set(next);
    this.applyTheme(next);
    this.savePreference(next);
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
  }

  private loadPreference(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'dark';
  }

  private savePreference(dark: boolean): void {
    localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
  }
}
