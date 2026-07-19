import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../api/environment';
import { GenericResponse, PageResponse, ClienteResponse, ReservaResponse, HospedajeResponse, toGenericResponse } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly API = `${environment.apiUrl}/cliente`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<GenericResponse<ClienteResponse[]>> {
    return this.http.get<any>(`${this.API}/getall`).pipe(
      map(r => toGenericResponse<ClienteResponse[]>(r, 'listCliente'))
    );
  }

  listarPaginado(page: number, size: number, sortField?: string, sortDir?: string, search?: string): Observable<PageResponse<ClienteResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sortField) params = params.set('sortField', sortField);
    if (sortDir) params = params.set('sortDir', sortDir);
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<ClienteResponse>>(`${this.API}/getallpaginated`, { params });
  }

  obtenerPorId(id: number): Observable<GenericResponse<ClienteResponse>> {
    return this.http.get<any>(`${this.API}/getbyid/${id}`).pipe(
      map(r => toGenericResponse<ClienteResponse>(r, raw => raw?.listCliente?.[0]))
    );
  }

  buscar(termino: string): Observable<GenericResponse<ClienteResponse[]>> {
    return this.http.get<any>(`${this.API}/search?termino=${termino}`).pipe(
      map(r => toGenericResponse<ClienteResponse[]>(r, 'listCliente'))
    );
  }

  buscarPorTelefono(telefono: string): Observable<GenericResponse<ClienteResponse>> {
    return this.http.get<any>(`${this.API}/getbytelefono/${telefono}`).pipe(
      map(r => toGenericResponse<ClienteResponse>(r, raw => raw?.listCliente?.[0]))
    );
  }

  crear(data: any): Observable<GenericResponse<ClienteResponse>> {
    return this.http.post<any>(`${this.API}/insert`, data).pipe(
      map(r => toGenericResponse<ClienteResponse>(r, raw => raw?.listCliente?.[0]))
    );
  }

  actualizar(id: number, data: any): Observable<GenericResponse<ClienteResponse>> {
    return this.http.put<any>(`${this.API}/update/${id}`, data).pipe(
      map(r => toGenericResponse<ClienteResponse>(r, raw => raw?.listCliente?.[0]))
    );
  }

  historialReservas(id: number): Observable<GenericResponse<ReservaResponse[]>> {
    return this.http.get<any>(`${this.API}/historialreservas/${id}`).pipe(
      map(r => toGenericResponse<ReservaResponse[]>(r, 'listReserva'))
    );
  }

  historialHospedajes(id: number): Observable<GenericResponse<HospedajeResponse[]>> {
    return this.http.get<any>(`${this.API}/historialhospedajes/${id}`).pipe(
      map(r => toGenericResponse<HospedajeResponse[]>(r, 'listHospedaje'))
    );
  }
}
