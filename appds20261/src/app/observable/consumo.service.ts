import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, toGenericResponse } from '../shared/models';

export interface ConsumoResponse {
  id: number;
  idConsumo: string;
  hospedajeId: number;
  usuarioId: number;
  usuarioNombre: string;
  tipoConsumo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observacion: string;
  fechaRegistro: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ConsumoService {
  private readonly API = `${environment.apiUrl}/consumo`;

  constructor(private http: HttpClient) {}

  listarPorHospedaje(hospedajeId: number): Observable<GenericResponse<ConsumoResponse[]>> {
    return this.http.get<any>(`${this.API}/getbyhospedaje/${hospedajeId}`).pipe(
      map(r => toGenericResponse<ConsumoResponse[]>(r, 'listConsumo'))
    );
  }

  registrar(data: any): Observable<GenericResponse<ConsumoResponse>> {
    return this.http.post<any>(`${this.API}/insert`, data).pipe(
      map(r => toGenericResponse<ConsumoResponse>(r, raw => raw?.listConsumo?.[0]))
    );
  }

  actualizar(id: number, data: any): Observable<GenericResponse<ConsumoResponse>> {
    return this.http.put<any>(`${this.API}/update/${id}`, data).pipe(
      map(r => toGenericResponse<ConsumoResponse>(r, raw => raw?.listConsumo?.[0]))
    );
  }

  eliminar(id: number): Observable<GenericResponse<void>> {
    return this.http.delete<any>(`${this.API}/delete/${id}`).pipe(
      map(r => toGenericResponse<void>(r, () => undefined))
    );
  }

  obtenerTotal(hospedajeId: number): Observable<GenericResponse<number>> {
    return this.http.get<any>(`${this.API}/total/${hospedajeId}`).pipe(
      map(r => toGenericResponse<number>(r, () => {
        const m = r?.listMessage?.[0];
        return m ? parseFloat(m) : 0;
      }))
    );
  }
}
