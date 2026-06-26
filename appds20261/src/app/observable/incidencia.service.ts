import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, IncidenciaResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private readonly API = `${environment.apiUrl}/incidencia`;

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<GenericResponse<IncidenciaResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<IncidenciaResponse[]>(r, 'listIncidencia'))
    );
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
