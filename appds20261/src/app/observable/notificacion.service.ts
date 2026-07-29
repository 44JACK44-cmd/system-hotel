import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly API = `${environment.apiUrl}/notificacion`;

  constructor(private http: HttpClient) {}

  listarPendientes(): Observable<GenericResponse<any[]>> {
    return this.http.get<any>(`${this.API}/pendientes`).pipe(
      map(r => toGenericResponse<any[]>(r, 'listNotificacion'))
    );
  }

  listarTodas(): Observable<GenericResponse<any[]>> {
    return this.http.get<any>(`${this.API}/todas`).pipe(
      map(r => toGenericResponse<any[]>(r, 'listNotificacion'))
    );
  }

  contarPendientes(): Observable<GenericResponse<number>> {
    return this.http.get<any>(`${this.API}/contar`).pipe(
      map(r => toGenericResponse<number>(r, raw => raw?.pendientes))
    );
  }

  marcarLeida(id: number): Observable<GenericResponse<any>> {
    return this.http.post<any>(`${this.API}/marcarleida/${id}`, {}).pipe(
      map(r => toGenericResponse<any>(r, 'notificacion'))
    );
  }

  marcarTodasLeidas(): Observable<GenericResponse<any>> {
    return this.http.post<any>(`${this.API}/marcartodasleidas`, {}).pipe(
      map(r => toGenericResponse<any>(r, raw => undefined))
    );
  }
}
