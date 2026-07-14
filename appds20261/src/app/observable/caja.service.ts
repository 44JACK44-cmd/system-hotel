import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, toGenericResponse } from '../shared/models';

export interface CajaResponse {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  fechaApertura: string;
  fechaCierre: string;
  montoInicial: number;
  totalIngresos: number;
  totalEgresos: number;
  balanceFinal: number;
  estado: string;
  observacion: string;
}

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly API = `${environment.apiUrl}/caja`;

  constructor(private http: HttpClient) {}

  obtenerActual(): Observable<GenericResponse<CajaResponse>> {
    return this.http.get<any>(`${this.API}/actual`).pipe(
      map(r => toGenericResponse<CajaResponse>(r, raw => raw?.listCaja?.[0]))
    );
  }

  historial(): Observable<GenericResponse<CajaResponse[]>> {
    return this.http.get<any>(`${this.API}/historial`).pipe(
      map(r => toGenericResponse<CajaResponse[]>(r, 'listCaja'))
    );
  }

  abrir(data: any): Observable<GenericResponse<CajaResponse>> {
    return this.http.post<any>(`${this.API}/abrir`, data).pipe(
      map(r => toGenericResponse<CajaResponse>(r, raw => raw?.listCaja?.[0]))
    );
  }

  cerrar(id: number, data: any): Observable<GenericResponse<CajaResponse>> {
    return this.http.post<any>(`${this.API}/cerrar/${id}`, data).pipe(
      map(r => toGenericResponse<CajaResponse>(r, raw => raw?.listCaja?.[0]))
    );
  }
}
