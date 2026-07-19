import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, PageResponse, UsuarioResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly API = `${environment.apiUrl}/usuario`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<GenericResponse<UsuarioResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<UsuarioResponse[]>(r, 'listUsuario'))
    );
  }

  listarPaginado(page: number, size: number, sortField?: string, sortDir?: string, search?: string): Observable<PageResponse<UsuarioResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sortField) params = params.set('sortField', sortField);
    if (sortDir) params = params.set('sortDir', sortDir);
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<UsuarioResponse>>(`${this.API}/getallpaginated`, { params });
  }

  obtenerPorId(id: number): Observable<GenericResponse<UsuarioResponse>> {
    return this.http.get<any>(`${this.API}/getbyid/${id}`).pipe(
      map(r => toGenericResponse<UsuarioResponse>(r, raw => raw?.listUsuario?.[0]))
    );
  }

  crear(data: any): Observable<GenericResponse<UsuarioResponse>> {
    return this.http.post<any>(`${this.API}/insert`, data).pipe(
      map(r => toGenericResponse<UsuarioResponse>(r, raw => raw?.listUsuario?.[0]))
    );
  }

  actualizar(id: number, data: any): Observable<GenericResponse<UsuarioResponse>> {
    return this.http.put<any>(`${this.API}/update/${id}`, data).pipe(
      map(r => toGenericResponse<UsuarioResponse>(r, raw => raw?.listUsuario?.[0]))
    );
  }

  cambiarEstado(id: number): Observable<GenericResponse<void>> {
    return this.http.patch<any>(`${this.API}/togglestate/${id}`, {}).pipe(
      map(r => toGenericResponse<void>(r, raw => undefined))
    );
  }

  eliminar(id: number): Observable<GenericResponse<void>> {
    return this.http.delete<any>(`${this.API}/delete/${id}`).pipe(
      map(r => toGenericResponse<void>(r, raw => undefined))
    );
  }
}
