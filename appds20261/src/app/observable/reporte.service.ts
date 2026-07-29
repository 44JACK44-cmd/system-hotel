import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly API = `${environment.apiUrl}/reporte`;

  constructor(private http: HttpClient) {}

  ingresos(inicio: string, fin: string): Observable<GenericResponse<any>> {
    return this.http.get<any>(`${this.API}/ingresos?inicio=${inicio}&fin=${fin}`).pipe(
      map(r => toGenericResponse<any>(r, 'reporte'))
    );
  }

  ingresosPorMetodo(inicio: string, fin: string): Observable<GenericResponse<any>> {
    return this.http.get<any>(`${this.API}/ingresosbymethod?inicio=${inicio}&fin=${fin}`).pipe(
      map(r => toGenericResponse<any>(r, 'reporte'))
    );
  }

  ocupacion(fecha: string): Observable<GenericResponse<any>> {
    return this.http.get<any>(`${this.API}/ocupacion?fecha=${fecha}`).pipe(
      map(r => toGenericResponse<any>(r, 'reporte'))
    );
  }

  reservasNoConcretadas(inicio: string, fin: string): Observable<GenericResponse<any>> {
    return this.http.get<any>(`${this.API}/reservasnoconcretadas?inicio=${inicio}&fin=${fin}`).pipe(
      map(r => toGenericResponse<any>(r, 'reporte'))
    );
  }

  historialIncidencias(): Observable<GenericResponse<any[]>> {
    return this.http.get<any>(`${this.API}/incidencias`).pipe(
      map(r => toGenericResponse<any[]>(r, 'listReporte'))
    );
  }

  rankingHabitaciones(): Observable<GenericResponse<any[]>> {
    return this.http.get<any>(`${this.API}/rankinghabitaciones`).pipe(
      map(r => toGenericResponse<any[]>(r, 'listReporte'))
    );
  }
}
