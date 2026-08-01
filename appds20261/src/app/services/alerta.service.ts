import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { EstadoActualizacionService } from './estado-actualizacion.service';

export interface AlertaAccion {
  label: string;
  accion: string;
  entidadTipo: string;
  entidadId: number | null;
}

export interface Alerta {
  grupoId: string;
  tipo: 'URGENTE' | 'CRITICA' | 'IMPORTANTE' | 'AVISO' | 'INFORMATIVA' | 'EXITO';
  titulo: string;
  descripcion: string;
  icono: string;
  modulo: string;
  timestamp: string;
  fecha: string;
  hora: string;
  accion: string;
  accionLabel: string;
  leida: boolean;
  cantidad: number;
  entidadTipo: string;
  entidadId: number;
  expiracion: string;
  categoria: string;
  acciones: AlertaAccion[];
}

export interface ActividadEntry {
  id: number;
  accion: string;
  modulo: string;
  detalle: string;
  fecha: string;
  usuarioId: number;
}

export interface AlertaConfig {
  sonidoActivado: boolean;
  tiempoActualizacionSegundos: number;
  emergentesActivadas: boolean;
  duracionInformativasHoras: number;
}

export interface AlertaResumen {
  urgentes: number;
  criticas: number;
  importantes: number;
  avisos: number;
  informativas: number;
  exitos: number;
  total: number;
  noLeidas: number;
  pendientes: number;
  completadasHoy: number;
}

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private readonly API = `${environment.apiUrl}/alertas`;

  activeFilter = signal<string | null>(null);

  private audio: HTMLAudioElement | null = null;

  constructor(
    private http: HttpClient,
    private estadoActualizacion: EstadoActualizacionService
  ) {}

  private getAudio(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4='; // minified beep
      this.audio.volume = 0.3;
    }
    return this.audio;
  }

  playSound(): void {
    try { this.getAudio().play(); } catch { }
  }

  getAlertas(): Observable<Alerta[]> {
    return this.http.get<any>(`${this.API}`).pipe(
      map(res => (res?.listReporte || []) as Alerta[])
    );
  }

  getResumen(): Observable<AlertaResumen> {
    return this.http.get<any>(`${this.API}/resumen`).pipe(
      map(res => (res?.reporte?.resumen || {}) as AlertaResumen)
    );
  }

  getActividad(limite = 20): Observable<ActividadEntry[]> {
    return this.http.get<any>(`${this.API}/actividad`, { params: { limite } }).pipe(
      map(res => (res?.listReporte || []) as ActividadEntry[])
    );
  }

  marcarLeida(grupoId: string): Observable<any> {
    return this.http.post<any>(`${this.API}/marcarleida`, { grupoId });
  }

  marcarTodasLeidas(): Observable<any> {
    return this.http.post<any>(`${this.API}/marcartodasleidas`, {});
  }

  getConfiguracion(): Observable<AlertaConfig> {
    return this.http.get<any>(`${this.API}/configuracion`).pipe(
      map(res => (res?.reporte || {}) as AlertaConfig)
    );
  }

  actualizarConfiguracion(config: Partial<AlertaConfig>): Observable<any> {
    return this.http.put<any>(`${this.API}/configuracion`, config);
  }

  triggerRefresh(): void {
    this.estadoActualizacion.emitir('NOTIFICACION_CAMBIO');
  }
}
