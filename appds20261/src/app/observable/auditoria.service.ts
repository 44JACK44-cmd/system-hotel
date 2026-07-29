import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, PageResponse, AuditoriaResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly API = `${environment.apiUrl}/auditoria`;

  constructor(private http: HttpClient) {}

  listarPaginado(
    usuarioId?: number, modulo?: string,
    fechaDesde?: string, fechaHasta?: string,
    page: number = 0, size: number = 20,
    sortField?: string, sortDir?: string
  ): Observable<PageResponse<AuditoriaResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (usuarioId != null) params = params.set('usuarioId', usuarioId);
    if (modulo) params = params.set('modulo', modulo);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);
    if (sortField) params = params.set('sortField', sortField);
    if (sortDir) params = params.set('sortDir', sortDir);
    return this.http.get<PageResponse<AuditoriaResponse>>(`${this.API}/getallpaginated`, { params });
  }
}
