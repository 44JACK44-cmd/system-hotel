import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, PageResponse, ReservaResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private readonly API = `${environment.apiUrl}/reserva`;

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<GenericResponse<ReservaResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<ReservaResponse[]>(r, 'listReserva'))
    );
  }

  listarPaginado(page: number, size: number, sortField?: string, sortDir?: string, search?: string): Observable<PageResponse<ReservaResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sortField) params = params.set('sortField', sortField);
    if (sortDir) params = params.set('sortDir', sortDir);
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<ReservaResponse>>(`${this.API}/getallpaginated`, { params });
  }

  listarDelDia(): Observable<GenericResponse<ReservaResponse[]>> {
    return this.http.get<any>(`${this.API}/getbydate`).pipe(
      map(r => toGenericResponse<ReservaResponse[]>(r, 'listReserva'))
    );
  }

  listarPorEstado(estado: string): Observable<GenericResponse<ReservaResponse[]>> {
    return this.http.get<any>(`${this.API}/getbystate/${estado}`).pipe(
      map(r => toGenericResponse<ReservaResponse[]>(r, 'listReserva'))
    );
  }

  obtenerPorId(id: number): Observable<GenericResponse<ReservaResponse>> {
    return this.http.get<any>(`${this.API}/getbyid/${id}`).pipe(
      map(r => toGenericResponse<ReservaResponse>(r, raw => raw?.listReserva?.[0]))
    );
  }

  crear(data: any): Observable<GenericResponse<ReservaResponse>> {
    return this.http.post<any>(`${this.API}/insert`, data).pipe(
      map(r => toGenericResponse<ReservaResponse>(r, raw => raw?.listReserva?.[0]))
    );
  }

  cancelar(id: number): Observable<GenericResponse<void>> {
    return this.http.post<any>(`${this.API}/cancel/${id}`, {}).pipe(
      map(r => toGenericResponse<void>(r, raw => undefined))
    );
  }

  actualizar(id: number, data: any): Observable<GenericResponse<ReservaResponse>> {
    return this.http.put<any>(`${this.API}/update/${id}`, data).pipe(
      map(r => toGenericResponse<ReservaResponse>(r, raw => raw?.listReserva?.[0]))
    );
  }

  verificarDisponibilidad(habitacionId: number, fechaEntrada: string, fechaSalida: string): Observable<GenericResponse<boolean>> {
    return this.http.get<any>(
      `${this.API}/checkavailability?habitacionId=${habitacionId}&fechaEntrada=${fechaEntrada}&fechaSalida=${fechaSalida}`
    ).pipe(
      map(r => toGenericResponse<boolean>(r, raw => raw?.disponible))
    );
  }
}
