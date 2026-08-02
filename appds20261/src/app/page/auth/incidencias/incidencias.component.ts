import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IncidenciaService } from '../../../observable/incidencia.service';
import { HabitacionService } from '../../../observable/habitacion.service';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule, SelectModule, TextareaModule, PaginatorModule],
  providers: [MessageService],
  templateUrl: './incidencias.component.html',
  styleUrls: ['./incidencias.component.css']
})
export class IncidenciasComponent implements OnInit, OnDestroy {
  private incidenciaService = inject(IncidenciaService);
  private habService = inject(HabitacionService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private estadoActualizacion = inject(EstadoActualizacionService);
  private router = inject(Router);

  // Cola de acciones pendientes
  private accionPendiente: { entidadId?: number; accion?: string } | null = null;

  incidencias: any[] = [];
  habitaciones: any[] = [];
  loading = false;
  searchTerm = '';
  loadingHabitaciones = false;

  /* Pagination */
  page = 0;
  pageSize = 10;
  totalRecords = 0;

  /* Sort */
  sortField = '';
  sortDir: 'asc' | 'desc' = 'asc';

  /** Paginated slice for the table (in-memory, since active incidents are inherently limited) */
  get paginatedIncidencias(): any[] {
    let items = this.incidenciasActivas;
    if (this.sortField) {
      items = [...items].sort((a, b) => {
        const va = (a[this.sortField] || '').toString().toLowerCase();
        const vb = (b[this.sortField] || '').toString().toLowerCase();
        return this.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    const start = this.page * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.page = 0;
  }

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  get incidenciasActivas(): any[] {
    return this.incidencias.filter(i => i.estado === 'ACTIVA');
  }

  get habitacionesLimpias(): any[] {
    return this.habitaciones.filter(h => h.estado === 'DISPONIBLE');
  }

  get habitacionesSucias(): any[] {
    return this.habitaciones.filter(h => h.estado === 'LIMPIEZA' || h.estado === 'SUCIA');
  }

  get habitacionesEnProgreso(): any[] {
    return this.incidenciasActivas;
  }

  get habitacionesMantenimiento(): any[] {
    return this.habitaciones.filter(h => h.estado === 'MANTENIMIENTO');
  }

  getActiveIncidentForRoom(hab: any): any {
    return this.incidenciasActivas.find(i => String(i.habitacionNumero) === String(hab.numero)) || null;
  }

  tipos = [
    { label: 'Limpieza', value: 'LIMPIEZA' },
    { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
    { label: 'Servicio limpieza huésped', value: 'SERVICIO_LIMPIEZA_HUESPED' },
    { label: 'Limpieza check-out', value: 'LIMPIEZA_CHECKOUT' }
  ];

  incidenciaForm = this.fb.group({
    habitacionId: [null, Validators.required],
    tipo: ['LIMPIEZA', Validators.required],
    motivo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300), this.noSoloEspacios]]
  });

  private noSoloEspacios(control: any): { [key: string]: any } | null {
    if (!control.value) return null;
    if (!/\S/.test(String(control.value))) return { soloEspacios: true };
    return null;
  }

  ngOnInit(): void {
    this.loadIncidencias();
    this.loadHabitaciones();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.loadIncidencias());
    this.estadoActualizacion.on('HABITACION_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.loadHabitaciones());
    this.estadoActualizacion.on('INCIDENCIA_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.loadIncidencias());

    // Detectar navegación con state usando router.events
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      console.log('[ALERTAS] Incidencias - NavigationEnd detectado');
      this.procesarStateNavegacion();
    });
  }

  private procesarStateNavegacion(): void {
    const state = window.history.state as { entidadId?: number; accion?: string } | undefined;
    console.log('[ALERTAS] Incidencias - State recibido:', state);
    if (state?.entidadId || state?.accion) {
      if (this.loading || this.incidencias.length === 0) {
        console.log('[ALERTAS] Incidencias - Datos no listos, encolando acción...');
        this.accionPendiente = state;
      } else {
        console.log('[ALERTAS] Incidencias - Datos listos, ejecutando acción...');
        this.ejecutarAccionInicial(state);
        this.limpiarStateNavegacion();
      }
    }
  }

  private limpiarStateNavegacion(): void {
    window.history.replaceState({}, '', window.location.pathname);
  }

  private ejecutarAccionInicial(state: { entidadId?: number; accion?: string }): void {
    console.log('[ALERTAS] Incidencias - Ejecutando acción:', state);
    switch (state.accion) {
      case 'resolver-todas':
        console.log('[ALERTAS] Incidencias - Finalizando todas las incidencias activas');
        this.finalizarTodas();
        break;
      case 'Resolver incidencia':
      case 'Ver detalle':
        if (state.entidadId) {
          console.log('[ALERTAS] Incidencias - Buscando incidencia:', state.entidadId);
          const inc = this.incidencias.find(i => i.id === state.entidadId);
          if (inc) {
            console.log('[ALERTAS] Incidencias - Incidencia encontrada, llamando finalizar');
            this.finalizar(inc);
          } else {
            console.log('[ALERTAS] Incidencias - Incidencia NO encontrada');
          }
        }
        break;
      default:
        console.log('[ALERTAS] Incidencias - Acción no reconocida:', state.accion);
    }
    this.accionPendiente = null;
  }

  private finalizarTodas(): void {
    const ids = this.incidencias.map(i => i.id).filter((id): id is number => id != null);
    if (ids.length === 0) {
      console.log('[ALERTAS] Incidencias - No hay incidencias activas que finalizar');
      return;
    }
    console.log('[ALERTAS] Incidencias - Finalizando', ids.length, 'incidencias');
    this.loading = true;
    let done = 0;
    ids.forEach(id => {
      this.incidenciaService.finalizar(id).subscribe({
        next: () => {
          done++;
          if (done === ids.length) {
            this.loading = false;
            this.messageService.add({ severity: 'success', summary: 'Exito', detail: `${done} incidencia(s) finalizada(s)` });
            this.loadIncidencias();
            this.estadoActualizacion.habitacionCambio();
            this.estadoActualizacion.incidenciaCambio();
            this.estadoActualizacion.notificacionCambio();
          }
        },
        error: () => {
          done++;
          if (done === ids.length) {
            this.loading = false;
            this.loadIncidencias();
          }
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(event: any): void {
    this.page = event.page;
    this.pageSize = event.rows;
  }

  loadIncidencias(): void {
    this.loading = true;
    this.incidenciaService.listarActivas().subscribe({
      next: res => { this.incidencias = res.data || []; this.totalRecords = this.incidenciasActivas.length; this.page = 0; this.loading = false; this.cdr.detectChanges(); this.appRef.tick(); this.procesarStateNavegacion(); },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar incidencias' }); this.procesarStateNavegacion(); }
    });
  }

  loadHabitaciones(): void {
    this.habService.listarActivas().subscribe({
      next: res => {
        this.habitaciones = (res.data || [])
          .map((h: any) => ({ ...h, label: `${h.numero} - ${h.tipo} (${h.estado})` }));
        this.cdr.detectChanges();
        this.appRef.tick();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar habitaciones' })
    });
  }

  save(): void {
    if (this.incidenciaForm.invalid) return;
    const habId = this.incidenciaForm.value.habitacionId;
    const hab = this.habitaciones.find(h => h.id === habId);
    const tipo = this.incidenciaForm.value.tipo;
    if (hab && hab.estado === 'OCUPADA' && tipo === 'LIMPIEZA') {
      this.messageService.add({ severity: 'warn', summary: 'RN-11', detail: 'No se puede crear incidencia de limpieza en habitación OCUPADA' });
      return;
    }
    this.loading = true;
    const payload = { ...this.incidenciaForm.value, motivo: this.incidenciaForm.value.motivo?.trim() };
    this.incidenciaService.crear(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Incidencia registrada' });
        this.incidenciaForm.reset({ tipo: 'LIMPIEZA' });
        this.loading = false;
        this.loadIncidencias();
        this.estadoActualizacion.habitacionCambio();
        this.estadoActualizacion.incidenciaCambio();
        this.estadoActualizacion.notificacionCambio();
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error' }); }
    });
  }

  asignarLimpieza(hab: any): void {
    this.incidenciaService.crear({
      habitacionId: hab.id,
      tipo: 'LIMPIEZA',
      motivo: `Limpieza asignada manualmente - Hab. ${hab.numero}`
    }).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Limpieza asignada' }); this.loadIncidencias(); this.estadoActualizacion.habitacionCambio(); this.estadoActualizacion.incidenciaCambio(); this.estadoActualizacion.notificacionCambio(); },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error' })
    });
  }

  verReporte(inc: any): void {
    if (inc?.habitacionNumero) {
      this.messageService.add({ severity: 'info', summary: 'Incidencia', detail: `Reporte de Hab. ${inc.habitacionNumero}: ${inc.motivo}` });
    }
  }

  verDetalles(hab: any): void {
    const inc = this.getActiveIncidentForRoom(hab);
    if (inc) {
      this.messageService.add({ severity: 'info', summary: `Hab. ${hab.numero}`, detail: `${inc.tipo}: ${inc.motivo}` });
    } else {
      this.messageService.add({ severity: 'info', summary: `Hab. ${hab.numero}`, detail: `Estado: ${hab.estado} - ${hab.tipo}` });
    }
  }

  finalizar(incidencia: any): void {
    this.loading = true;
    this.incidenciaService.finalizar(incidencia.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Incidencia finalizada' });
        this.loading = false;
        this.loadIncidencias();
        this.estadoActualizacion.habitacionCambio();
        this.estadoActualizacion.incidenciaCambio();
        this.estadoActualizacion.notificacionCambio();
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error' }); }
    });
  }
}
