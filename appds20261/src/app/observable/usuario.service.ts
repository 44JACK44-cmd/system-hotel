import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, PageResponse, UsuarioResponse, SuggestionResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly API = `${environment.apiUrl}/usuario`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-User-Id': userId || ''
    });
  }

  getSuggestions(termino: string): Observable<SuggestionResponse[]> {
    return this.http.get<SuggestionResponse[]>(`${this.API}/search/suggestions?termino=${encodeURIComponent(termino)}`);
  }

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

  actualizarCompleto(id: number, data: any): Observable<GenericResponse<UsuarioResponse>> {
    return this.http.put<any>(`${this.API}/updatecompleto/${id}`, data, { headers: this.getAuthHeaders() }).pipe(
      map(r => toGenericResponse<UsuarioResponse>(r, raw => raw?.listUsuario?.[0]))
    );
  }

  cambiarEstado(id: number): Observable<GenericResponse<void>> {
    return this.http.patch<any>(`${this.API}/togglestate/${id}`, {}).pipe(
      map(r => toGenericResponse<void>(r, raw => undefined))
    );
  }

  eliminar(id: number): Observable<GenericResponse<void>> {
    return this.http.delete<any>(`${this.API}/delete/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map(r => toGenericResponse<void>(r, raw => undefined))
    );
  }

  updateProfile(id: number, data: { nombreCompleto?: string; email?: string; telefono?: string }): Observable<GenericResponse<UsuarioResponse>> {
    return this.http.patch<any>(`${this.API}/updateprofile/${id}`, data).pipe(
      map(r => toGenericResponse<UsuarioResponse>(r, raw => raw?.listUsuario?.[0]))
    );
  }

  cambiarPassword(id: number, currentPassword: string, newPassword: string): Observable<GenericResponse<void>> {
    return this.http.patch<any>(`${this.API}/cambiarpassword/${id}`, { currentPassword, newPassword }).pipe(
      map(r => toGenericResponse<void>(r, raw => undefined))
    );
  }

  resetPasswordByAdmin(id: number, newPassword: string, confirmPassword: string): Observable<GenericResponse<void>> {
    return this.http.patch<any>(`${this.API}/resetpassword/${id}`, { newPassword, confirmPassword }, { headers: this.getAuthHeaders() }).pipe(
      map(r => toGenericResponse<void>(r, raw => undefined))
    );
  }

  uploadAvatar(id: number, file: File): Observable<GenericResponse<UsuarioResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.API}/uploadavatar/${id}`, formData).pipe(
      map(r => toGenericResponse<UsuarioResponse>(r, raw => raw?.listUsuario?.[0]))
    );
  }
}
