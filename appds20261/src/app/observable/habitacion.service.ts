import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, HabitacionResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class HabitacionService {
  private readonly API = `${environment.apiUrl}/habitacion`;

  constructor(private http: HttpClient) {}

  listarActivas(): Observable<GenericResponse<HabitacionResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<HabitacionResponse[]>(r, 'listHabitacion'))
    );
  }

  listarTodas(): Observable<GenericResponse<HabitacionResponse[]>> {
    return this.http.get<any>(`${this.API}/getallwithdisabled`).pipe(
      map(r => toGenericResponse<HabitacionResponse[]>(r, 'listHabitacion'))
    );
  }

  obtenerPorId(id: number): Observable<GenericResponse<HabitacionResponse>> {
    return this.http.get<any>(`${this.API}/getbyid/${id}`).pipe(
      map(r => toGenericResponse<HabitacionResponse>(r, raw => raw?.listHabitacion?.[0]))
    );
  }

  obtenerMapa(): Observable<GenericResponse<Record<number, HabitacionResponse[]>>> {
    return this.http.get<any>(`${this.API}/map`).pipe(
      map(r => toGenericResponse<Record<number, HabitacionResponse[]>>(r, raw => raw?.reporte || raw?.data))
    );
  }

  crear(data: any): Observable<GenericResponse<HabitacionResponse>> {
    return this.http.post<any>(`${this.API}/insert`, data).pipe(
      map(r => toGenericResponse<HabitacionResponse>(r, raw => raw?.listHabitacion?.[0]))
    );
  }

  actualizar(id: number, data: any): Observable<GenericResponse<HabitacionResponse>> {
    return this.http.put<any>(`${this.API}/update/${id}`, data).pipe(
      map(r => toGenericResponse<HabitacionResponse>(r, raw => raw?.listHabitacion?.[0]))
    );
  }

  cambiarEstado(id: number, estado: string): Observable<GenericResponse<void>> {
    return this.http.patch<any>(`${this.API}/changestate/${id}`, { estado }).pipe(
      map(r => toGenericResponse<void>(r, raw => undefined))
    );
  }

  eliminar(id: number): Observable<GenericResponse<void>> {
    return this.http.delete<any>(`${this.API}/delete/${id}`).pipe(
      map(r => toGenericResponse<void>(r, raw => undefined))
    );
  }
}
