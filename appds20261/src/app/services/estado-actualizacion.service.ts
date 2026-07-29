import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable, filter, map } from 'rxjs';

export type TipoEvento =
  | 'HABITACION_CAMBIO'
  | 'HOSPEDAJE_CAMBIO'
  | 'RESERVA_CAMBIO'
  | 'PAGO_CAMBIO'
  | 'CLIENTE_CAMBIO'
  | 'CONSUMO_CAMBIO'
  | 'INCIDENCIA_CAMBIO'
  | 'USUARIO_CAMBIO'
  | 'CONFIGURACION_CAMBIO'
  | 'NOTIFICACION_CAMBIO';

export interface EventoEstado {
  tipo: TipoEvento;
  data?: any;
}

@Injectable({ providedIn: 'root' })
export class EstadoActualizacionService {
  private events = new Subject<EventoEstado>();

  emitir(tipo: TipoEvento, data?: any): void {
    this.events.next({ tipo, data });
  }

  on(tipo: TipoEvento): Observable<EventoEstado> {
    return this.events.pipe(
      filter(e => e.tipo === tipo)
    );
  }

  /* ---- helpers ---- */
  habitacionCambio(data?: any): void { this.emitir('HABITACION_CAMBIO', data); }
  hospedajeCambio(data?: any): void { this.emitir('HOSPEDAJE_CAMBIO', data); }
  reservaCambio(data?: any): void { this.emitir('RESERVA_CAMBIO', data); }
  pagoCambio(data?: any): void { this.emitir('PAGO_CAMBIO', data); }
  clienteCambio(data?: any): void { this.emitir('CLIENTE_CAMBIO', data); }
  consumoCambio(data?: any): void { this.emitir('CONSUMO_CAMBIO', data); }
  incidenciaCambio(data?: any): void { this.emitir('INCIDENCIA_CAMBIO', data); }
  usuarioCambio(data?: any): void { this.emitir('USUARIO_CAMBIO', data); }
  configuracionCambio(data?: any): void { this.emitir('CONFIGURACION_CAMBIO', data); }
  notificacionCambio(data?: any): void { this.emitir('NOTIFICACION_CAMBIO', data); }
}
