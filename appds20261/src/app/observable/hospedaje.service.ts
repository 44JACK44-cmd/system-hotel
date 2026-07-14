import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, HospedajeResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class HospedajeService {
  private readonly API = `${environment.apiUrl}/hospedaje`;

  constructor(private http: HttpClient) {}

  listarActivos(): Observable<GenericResponse<HospedajeResponse[]>> {
    return this.http.get<any>(`${this.API}/getactive`).pipe(
      map(r => toGenericResponse<HospedajeResponse[]>(r, 'listHospedaje'))
    );
  }

  listarTodos(): Observable<GenericResponse<HospedajeResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<HospedajeResponse[]>(r, 'listHospedaje'))
    );
  }

  obtenerPorId(id: number): Observable<GenericResponse<HospedajeResponse>> {
    return this.http.get<any>(`${this.API}/getbyid/${id}`).pipe(
      map(r => toGenericResponse<HospedajeResponse>(r, raw => raw?.listHospedaje?.[0]))
    );
  }

  checkIn(data: any): Observable<GenericResponse<HospedajeResponse>> {
    return this.http.post<any>(`${this.API}/checkin`, data).pipe(
      map(r => toGenericResponse<HospedajeResponse>(r, raw => raw?.listHospedaje?.[0]))
    );
  }

  checkInDirecto(data: any): Observable<GenericResponse<HospedajeResponse>> {
    return this.http.post<any>(`${this.API}/checkindirect`, data).pipe(
      map(r => toGenericResponse<HospedajeResponse>(r, raw => raw?.listHospedaje?.[0]))
    );
  }

  checkOut(id: number, data: any): Observable<GenericResponse<HospedajeResponse>> {
    return this.http.post<any>(`${this.API}/checkout/${id}`, data).pipe(
      map(r => toGenericResponse<HospedajeResponse>(r, raw => raw?.listHospedaje?.[0]))
    );
  }

  extenderEstadia(id: number, data: any): Observable<GenericResponse<HospedajeResponse>> {
    return this.http.put<any>(`${this.API}/extend/${id}`, data).pipe(
      map(r => toGenericResponse<HospedajeResponse>(r, raw => raw?.listHospedaje?.[0]))
    );
  }

  cambiarHabitacion(id: number, data: any): Observable<GenericResponse<HospedajeResponse>> {
    return this.http.put<any>(`${this.API}/change-room/${id}`, data).pipe(
      map(r => toGenericResponse<HospedajeResponse>(r, raw => raw?.listHospedaje?.[0]))
    );
  }
}
