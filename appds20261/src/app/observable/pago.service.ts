import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, PageResponse, PagoResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly API = `${environment.apiUrl}/pago`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<GenericResponse<PagoResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<PagoResponse[]>(r, 'listPago'))
    );
  }

  listarPaginado(page: number, size: number, filtros?: { sortField?: string; sortDir?: string; search?: string; tipo?: string; metodo?: string; inicio?: string; fin?: string }): Observable<PageResponse<PagoResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    const f = filtros || {};
    if (f.sortField) params = params.set('sortField', f.sortField);
    if (f.sortDir) params = params.set('sortDir', f.sortDir);
    if (f.search) params = params.set('search', f.search);
    if (f.tipo) params = params.set('tipo', f.tipo);
    if (f.metodo) params = params.set('metodo', f.metodo);
    if (f.inicio) params = params.set('inicio', f.inicio);
    if (f.fin) params = params.set('fin', f.fin);
    return this.http.get<PageResponse<PagoResponse>>(`${this.API}/getallpaginated`, { params });
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
