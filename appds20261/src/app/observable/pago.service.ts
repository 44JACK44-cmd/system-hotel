import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, PagoResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly API = `${environment.apiUrl}/pago`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<GenericResponse<PagoResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<PagoResponse[]>(r, 'listPago'))
    );
  }

  obtenerPorId(id: number): Observable<GenericResponse<PagoResponse>> {
    return this.http.get<any>(`${this.API}/getbyid/${id}`).pipe(
      map(r => toGenericResponse<PagoResponse>(r, raw => raw?.listPago?.[0]))
    );
  }

  listarPorReserva(reservaId: number): Observable<GenericResponse<PagoResponse[]>> {
    return this.http.get<any>(`${this.API}/getbyreserva/${reservaId}`).pipe(
      map(r => toGenericResponse<PagoResponse[]>(r, 'listPago'))
    );
  }

  listarPorHospedaje(hospedajeId: number): Observable<GenericResponse<PagoResponse[]>> {
    return this.http.get<any>(`${this.API}/getbyhospedaje/${hospedajeId}`).pipe(
      map(r => toGenericResponse<PagoResponse[]>(r, 'listPago'))
    );
  }

  registrar(data: any): Observable<GenericResponse<PagoResponse>> {
    return this.http.post<any>(`${this.API}/insert`, data).pipe(
      map(r => toGenericResponse<PagoResponse>(r, raw => raw?.listPago?.[0]))
    );
  }
}
