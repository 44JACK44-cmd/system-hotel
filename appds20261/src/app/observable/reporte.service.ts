import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  tendenciaOcupacion(inicio: string, fin: string): Observable<GenericResponse<any[]>> {
    return this.http.get<any>(`${this.API}/tendencia-ocupacion?inicio=${inicio}&fin=${fin}`).pipe(
      map(r => toGenericResponse<any[]>(r, 'listReporte'))
    );
  }

  reservasNoConcretadas(inicio: string, fin: string): Observable<GenericResponse<any>> {
    return this.http.get<any>(`${this.API}/reservasnoconcretadas?inicio=${inicio}&fin=${fin}`).pipe(
      map(r => toGenericResponse<any>(r, 'reporte'))
    );
  }

  historialIncidencias(filtros?: {
    inicio?: string | null;
    fin?: string | null;
    tipo?: string | null;
    estado?: string | null;
    usuario?: string | null;
    habitacion?: string | null;
    search?: string | null;
  }): Observable<GenericResponse<any[]>> {
    let params = new HttpParams();
    const f = filtros || {};
    if (f.inicio) params = params.set('inicio', f.inicio);
    if (f.fin) params = params.set('fin', f.fin);
    if (f.tipo) params = params.set('tipo', f.tipo);
    if (f.estado) params = params.set('estado', f.estado);
    if (f.usuario) params = params.set('usuario', f.usuario);
    if (f.habitacion) params = params.set('habitacion', f.habitacion);
    if (f.search) params = params.set('search', f.search);
    return this.http.get<any>(`${this.API}/incidencias`, { params }).pipe(
      map(r => toGenericResponse<any[]>(r, 'listReporte'))
    );
  }

  rankingHabitaciones(inicio?: string | null, fin?: string | null): Observable<GenericResponse<any[]>> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fin) params = params.set('fin', fin);
    return this.http.get<any>(`${this.API}/rankinghabitaciones`, { params }).pipe(
      map(r => toGenericResponse<any[]>(r, 'listReporte'))
    );
  }
}
