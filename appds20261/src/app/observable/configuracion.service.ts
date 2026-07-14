import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, ParametroResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private readonly API = `${environment.apiUrl}/parametro`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<GenericResponse<ParametroResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<ParametroResponse[]>(r, 'listParametro'))
    );
  }

  getByClave(clave: string): Observable<GenericResponse<ParametroResponse>> {
    return this.http.get<any>(`${this.API}/getbyclave/${clave}`).pipe(
      map(r => toGenericResponse<ParametroResponse>(r, raw => raw?.listParametro?.[0]))
    );
  }

  getByModulo(modulo: string): Observable<GenericResponse<ParametroResponse[]>> {
    return this.http.get<any>(`${this.API}/getbymodulo/${modulo}`).pipe(
      map(r => toGenericResponse<ParametroResponse[]>(r, 'listParametro'))
    );
  }

  upsert(data: any): Observable<GenericResponse<ParametroResponse>> {
    return this.http.post<any>(`${this.API}/upsert`, data).pipe(
      map(r => toGenericResponse<ParametroResponse>(r, raw => raw?.listParametro?.[0]))
    );
  }

  updateValor(clave: string, valor: string): Observable<GenericResponse<ParametroResponse>> {
    return this.http.patch<any>(`${this.API}/updatevalor/${clave}`, `"${valor}"`, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      map(r => toGenericResponse<ParametroResponse>(r, raw => raw?.listParametro?.[0]))
    );
  }
}
