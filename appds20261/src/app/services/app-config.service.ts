import { Injectable, signal } from '@angular/core';
import { ConfiguracionService } from '../observable/configuracion.service';
import { AuthService } from '../observable/auth.service';

export interface HotelConfig {
  nombre: string;
  logo: string;
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  departamento: string;
  pais: string;
  sitioWeb: string;
  eslogan: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private raw = signal<Record<string, string>>({});
  private loaded = false;

  readonly config = signal<HotelConfig>({
    nombre: '',
    logo: '',
    direccion: '',
    telefono: '',
    email: '',
    ciudad: '',
    departamento: '',
    pais: '',
    sitioWeb: '',
    eslogan: '',
  });

  constructor(private configSvc: ConfiguracionService, private authService: AuthService) {}

  load(): void {
    if (this.loaded) return;
    if (!this.authService.isLoggedIn()) return;
    this.fetchConfig();
  }

  refresh(): void {
    this.loaded = false;
    this.fetchConfig();
  }

  private fetchConfig(): void {
    this.configSvc.listarTodos().subscribe({
      next: res => {
        if (!res.success || !res.data) return;
        const map: Record<string, string> = {};
        for (const p of res.data) {
          map[p.clave] = p.valor || '';
        }
        this.raw.set(map);
        this.buildConfig(map);
        this.loaded = true;
      }
    });
  }

  private buildConfig(map: Record<string, string>): void {
    this.config.set({
      nombre: map['hotel.nombre'] || '',
      logo: map['hotel.logo'] || '',
      eslogan: map['hotel.eslogan'] || '',
      direccion: map['hotel.direccion'] || '',
      telefono: map['hotel.telefono'] || '',
      email: map['hotel.email'] || '',
      ciudad: map['hotel.ciudad'] || '',
      departamento: map['hotel.departamento'] || '',
      pais: map['hotel.pais'] || '',
      sitioWeb: map['hotel.sitio_web'] || '',
    });
  }

  get(key: string, fallback = ''): string {
    return this.raw()[key] ?? fallback;
  }

  nombre(): string { return this.config().nombre; }
  logo(): string { return this.config().logo; }
  eslogan(): string { return this.config().eslogan; }
  telefono(): string { return this.config().telefono; }
  email(): string { return this.config().email; }
  direccion(): string { return this.config().direccion; }
  ciudad(): string { return this.config().ciudad; }
}
