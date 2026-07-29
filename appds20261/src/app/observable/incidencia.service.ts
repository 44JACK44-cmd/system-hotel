import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, PageResponse, IncidenciaResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private readonly API = `${environment.apiUrl}/incidencia`;

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<GenericResponse<IncidenciaResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<IncidenciaResponse[]>(r, 'listIncidencia'))
    );
  }

  listarPaginado(page: number, size: number, sortField?: string, sortDir?: string, search?: string): Observable<PageResponse<IncidenciaResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sortField) params = params.set('sortField', sortField);
    if (sortDir) params = params.set('sortDir', sortDir);
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<IncidenciaResponse>>(`${this.API}/getallpaginated`, { params });
  }

  listarActivas(): Observable<GenericResponse<IncidenciaResponse[]>> {
    return this.http.get<any>(`${this.API}/getactive`).pipe(
      map(r => toGenericResponse<IncidenciaResponse[]>(r, 'listIncidencia'))
    );
  }

  obtenerPorId(id: number): Observable<GenericResponse<IncidenciaResponse>> {
    return this.http.get<any>(`${this.API}/getbyid/${id}`).pipe(
      map(r => toGenericResponse<IncidenciaResponse>(r, raw => raw?.listIncidencia?.[0]))
    );
  }

  crear(data: any): Observable<GenericResponse<IncidenciaResponse>> {
    return this.http.post<any>(`${this.API}/insert`, data).pipe(
      map(r => toGenericResponse<IncidenciaResponse>(r, raw => raw?.listIncidencia?.[0]))
    );
  }

  finalizar(id: number): Observable<GenericResponse<IncidenciaResponse>> {
    return this.http.put<any>(`${this.API}/finish/${id}`, {}).pipe(
      map(r => toGenericResponse<IncidenciaResponse>(r, raw => raw?.listIncidencia?.[0]))
    );
  }
}
