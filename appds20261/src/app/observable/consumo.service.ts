import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, toGenericResponse } from '../shared/models';

export interface ConsumoResponse {
  id: number;
  hospedajeId: number;
  usuarioId: number;
  usuarioNombre: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fechaRegistro: string;
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
}
