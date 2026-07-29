import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../../observable/auditoria.service';
import { AuthService } from '../../../observable/auth.service';
import { AuditoriaResponse } from '../../../shared/models';
import { Subject, merge, auditTime, takeUntil } from 'rxjs';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

@Component({
  selector: 'app-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actividad.html',
  styleUrl: './actividad.css',
})
export class Actividad implements OnInit, OnDestroy {
  private auditoriaService = inject(AuditoriaService);
  private authService = inject(AuthService);
  private estadoActualizacion = inject(EstadoActualizacionService);
  private destroy$ = new Subject<void>();

  actividades: AuditoriaResponse[] = [];
  loading = true;
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;
  pageSizeOptions = [10, 25, 50];

  filtroModulo = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';

  modulos = ['', 'PERFIL', 'SEGURIDAD', 'RESERVAS', 'HOSPEDAJES', 'PAGOS', 'CLIENTES', 'HABITACIONES', 'INCIDENCIAS', 'REPORTES', 'CONFIGURACION'];

  ngOnInit(): void {
    this.cargarActividades();
    merge(
      this.estadoActualizacion.on('HABITACION_CAMBIO'), this.estadoActualizacion.on('HOSPEDAJE_CAMBIO'),
      this.estadoActualizacion.on('RESERVA_CAMBIO'), this.estadoActualizacion.on('PAGO_CAMBIO'),
      this.estadoActualizacion.on('CLIENTE_CAMBIO'), this.estadoActualizacion.on('CONSUMO_CAMBIO'),
      this.estadoActualizacion.on('INCIDENCIA_CAMBIO'), this.estadoActualizacion.on('USUARIO_CAMBIO'),
      this.estadoActualizacion.on('CONFIGURACION_CAMBIO')
    ).pipe(auditTime(0), takeUntil(this.destroy$)).subscribe(() => this.cargarActividades());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  cargarActividades(): void {
    this.loading = true;
    const userId = this.authService.getUserId();
    this.auditoriaService.listarPaginado(
      userId,
      this.filtroModulo || undefined,
      this.filtroFechaDesde || undefined,
      this.filtroFechaHasta || undefined,
      this.page, this.size, 'fecha', 'desc'
    ).subscribe({
      next: (res) => {
        this.actividades = res.content || [];
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.page = res.page;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  filtrar(): void {
    this.page = 0;
    this.cargarActividades();
  }

  limpiarFiltros(): void {
    this.filtroModulo = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.page = 0;
    this.cargarActividades();
  }

  cambiarPagina(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.cargarActividades();
  }

  cambiarSize(size: number): void {
    this.size = size;
    this.page = 0;
    this.cargarActividades();
  }

  get paginas(): number[] {
    const max = 5;
    const start = Math.max(0, Math.min(this.page - Math.floor(max / 2), this.totalPages - max));
    const end = Math.min(start + max, this.totalPages);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }

  exportarCSV(): void {
    const headers = ['Fecha', 'Acción', 'Módulo', 'Detalle', 'IP'];
    const rows = this.actividades.map(a => [
      a.fecha ? new Date(a.fecha).toLocaleString('es-PE') : '',
      a.accion,
      a.modulo || '',
      (a.detalle || '').replace(/,/g, ';'),
      a.ip || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `actividad_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }
}
