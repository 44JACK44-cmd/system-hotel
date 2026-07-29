import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, toGenericResponse } from '../shared/models';

export interface EgresoResponse {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  concepto: string;
  categoria: string;
  monto: number;
  fechaRegistro: string;
  observacion: string;
}

@Injectable({ providedIn: 'root' })
export class EgresoService {
  private readonly API = `${environment.apiUrl}/egreso`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<GenericResponse<EgresoResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<EgresoResponse[]>(r, 'listEgreso'))
    );
  }

  registrar(data: any): Observable<GenericResponse<EgresoResponse>> {
    return this.http.post<any>(`${this.API}/insert`, data).pipe(
      map(r => toGenericResponse<EgresoResponse>(r, raw => raw?.listEgreso?.[0]))
    );
  }
}
