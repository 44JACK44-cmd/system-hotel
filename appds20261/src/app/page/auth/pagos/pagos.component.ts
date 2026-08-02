import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PagoService } from '../../../observable/pago.service';
import { EgresoService } from '../../../observable/egreso.service';
import { CajaService } from '../../../observable/caja.service';
import { HospedajeService } from '../../../observable/hospedaje.service';
import { ReservaService } from '../../../observable/reserva.service';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { PaginatorModule } from 'primeng/paginator';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PageResponse, HospedajeResponse } from '../../../shared/models';
import { LayoutStateService } from '../../../services/layout-state.service';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, SelectModule, AutoCompleteModule, InputNumberModule, PaginatorModule, DatePickerModule, TooltipModule],
  providers: [MessageService],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit, OnDestroy {
  private pagoService = inject(PagoService);
  private egresoService = inject(EgresoService);
  private cajaService = inject(CajaService);
  private reservaService = inject(ReservaService);
  private hospedajeService = inject(HospedajeService);
  private messageService = inject(MessageService);
  private layoutState = inject(LayoutStateService);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private estadoActualizacion = inject(EstadoActualizacionService);
  private router = inject(Router);

  // Cola de acciones pendientes
  private accionPendiente: { entidadId?: number; accion?: string } | null = null;

  Math = Math;
  pagos: any[] = [];
  allPagos: any[] = [];
  egresos: any[] = [];
  loading = false;
  dialogVisible = false;
  searchTerm = '';

  /* Filtros Historial de Transacciones */
  filterTipo = '';
  filterMetodo = '';
  filterInicio: Date | null = null;
  filterFin: Date | null = null;
  tipoOptions = [
    { label: 'Todos', value: null },
    { label: 'Adelanto', value: 'ADELANTO' },
    { label: 'Saldo', value: 'SALDO' },
    { label: 'Extensi&oacute;n', value: 'EXTENSION' }
  ];
  metodoOptions = [
    { label: 'Todos', value: null },
    { label: 'Yape', value: 'YAPE' },
    { label: 'Efectivo', value: 'EFECTIVO' }
  ];

  /* Server-side pagination */
  page = 0;
  pageSize = 20;
  totalRecords = 0;
  sortField = '';
  sortDir: 'asc' | 'desc' = 'asc';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  cajaActual: any = null;
  showCierreModal = false;
  cierreMontoFisico = 0;
  cierreObservacion = '';

  gastoConcepto = '';
  gastoCategoria = 'Mantenimiento';
  gastoMonto = 0;
  loadingGasto = false;

  pagoTipo = 'SALDO';
  pagoMonto = 0;
  pagoMetodo = 'EFECTIVO';
  pagoReferencia = '';
  pagoReservaId: number | null = null;
  pagoHospedajeId: number | null = null;
  pagoObservacion = '';
  loadingPago = false;

  reservasBuscadas: any[] = [];
  hospedajesBuscados: any[] = [];
  pagoReservaObj: any = null;
  pagoHospedajeObj: any = null;

  deudasPendientes: any[] = [];
  totalDeudas: number = 0;
  showCobrarModal: boolean = false;
  deudaSeleccionada: any = null;
  cobrarMonto: number = 0;
  cobrarMetodo: string = 'EFECTIVO';
  cobrarReferencia: string = '';
  cobrarObservacion: string = '';
  loadingCobrar: boolean = false;

  ngOnInit(): void {
    this.loadAllPagos();
    this.loadAllEgresos();
    this.loadCaja();
    this.loadPagos();
    this.loadDeudasPendientes();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => { this.page = 0; this.loadPagos(); });
    this.estadoActualizacion.on('PAGO_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadAllPagos();
      this.loadAllEgresos();
      this.loadCaja();
      this.loadPagos();
    });
    this.estadoActualizacion.on('HOSPEDAJE_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadAllPagos();
      this.loadPagos();
    });
    this.estadoActualizacion.on('RESERVA_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadAllPagos();
      this.loadPagos();
    });

    // Detectar navegación con state usando router.events
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      console.log('[ALERTAS] Pagos - NavigationEnd detectado');
      this.procesarStateNavegacion();
    });
  }

  private procesarStateNavegacion(): void {
    const state = window.history.state as { entidadId?: number; accion?: string } | undefined;
    console.log('[ALERTAS] Pagos - State recibido:', state);
    if (state?.entidadId || state?.accion) {
      if (this.loading || this.cajaActual === null) {
        console.log('[ALERTAS] Pagos - Datos no listos, encolando acción...');
        this.accionPendiente = state;
      } else {
        console.log('[ALERTAS] Pagos - Datos listos, ejecutando acción...');
        this.ejecutarAccionInicial(state);
        this.limpiarStateNavegacion();
      }
    }
  }

  private limpiarStateNavegacion(): void {
    window.history.replaceState({}, '', window.location.pathname);
  }

  private ejecutarAccionInicial(state: { entidadId?: number; accion?: string }): void {
    console.log('[ALERTAS] Pagos - Ejecutando acción:', state);
    switch (state.accion) {
      case 'cerrar-cajas':
      case 'Cerrar Caja':
        if (this.cajaActual?.estado === 'ABIERTO') {
          console.log('[ALERTAS] Pagos - Abriendo modal cierre de caja');
          this.showCierreModal = true;
        }
        break;
      case 'pago':
      case 'Registrar Pago':
        if (state.entidadId) {
          console.log('[ALERTAS] Pagos - Cargando deuda para pago:', state.entidadId);
          this.cargarDeudaParaPago(state.entidadId);
        }
        break;
      case 'cerrar-cajas-todos':
        console.log('[ALERTAS] Pagos - cerrar-cajas-todos: no implementado aún');
        break;
      default:
        console.log('[ALERTAS] Pagos - Acción no reconocida:', state.accion);
    }
    this.accionPendiente = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  /* Stats computed from full data */
  get totalEfectivo(): number {
    return this.allPagos.filter(p => p.metodo === 'EFECTIVO').reduce((s, p) => s + (p.monto || 0), 0);
  }

  get totalYape(): number {
    return this.allPagos.filter(p => p.metodo === 'YAPE').reduce((s, p) => s + (p.monto || 0), 0);
  }

  get totalIngresos(): number {
    return this.totalEfectivo + this.totalYape;
  }

  get totalEgresosMonto(): number {
    return this.egresos.reduce((s, e) => s + (e.monto || 0), 0);
  }

  get balanceNeto(): number {
    return this.totalIngresos - this.totalEgresosMonto;
  }

  getPagoBadge(tipo: string): string {
    const map: Record<string, string> = {
      ADELANTO: 'badge-info',
      SALDO: 'badge-success',
      EXTENSION: 'badge-confirmed'
    };
    return map[tipo] || 'badge-info';
  }

  loadDeudasPendientes(): void {
    this.hospedajeService.listarDeudasPendientes().subscribe({
      next: res => {
        this.deudasPendientes = (res.data || []) as any[];
        this.totalDeudas = this.deudasPendientes.reduce((sum, d) => sum + (d.deudaPendiente || 0), 0);
      },
      error: () => {}
    });
  }

  abrirCobrar(deuda: any): void {
    this.deudaSeleccionada = deuda;
    this.cobrarMonto = deuda.deudaPendiente;
    this.cobrarMetodo = 'EFECTIVO';
    this.cobrarReferencia = '';
    this.cobrarObservacion = '';
    this.showCobrarModal = true;
  }

  confirmarCobro(): void {
    if (!this.deudaSeleccionada || this.cobrarMonto <= 0) return;
    if (this.cobrarMonto > this.deudaSeleccionada.deudaPendiente) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'El monto no puede exceder la deuda pendiente' });
      return;
    }
    this.loadingCobrar = true;
    this.pagoService.registrar({
      tipo: 'SALDO',
      monto: this.cobrarMonto,
      metodo: this.cobrarMetodo,
      referencia: this.cobrarReferencia || null,
      hospedajeId: this.deudaSeleccionada.id,
      observacion: this.cobrarObservacion || null
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Pago registrado exitosamente' });
        this.showCobrarModal = false;
        this.loadingCobrar = false;
        this.loadAllPagos();
        this.loadPagos();
        this.loadDeudasPendientes();
        this.estadoActualizacion.pagoCambio();
        this.estadoActualizacion.hospedajeCambio();
      },
      error: (err) => {
        this.loadingCobrar = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al registrar pago' });
      }
    });
  }

  loadAllPagos(): void {
    this.pagoService.listarTodos().subscribe({
      next: res => { this.allPagos = res.data || []; this.cdr.detectChanges(); this.appRef.tick(); }
    });
  }

  loadAllEgresos(): void {
    this.egresoService.listarTodos().subscribe({
      next: res => { this.egresos = res.data || []; this.cdr.detectChanges(); this.appRef.tick(); }
    });
  }

  loadPagos(): void {
    this.loading = true;
    this.pagoService.listarPaginado(this.page, this.pageSize, {
      sortField: this.sortField || undefined,
      sortDir: this.sortDir,
      search: this.searchTerm || undefined,
      tipo: this.filterTipo || undefined,
      metodo: this.filterMetodo || undefined,
      inicio: this.filterInicio ? this.toDateStr(this.filterInicio) : undefined,
      fin: this.filterFin ? this.toDateStr(this.filterFin) : undefined
    }).subscribe({
      next: (res: PageResponse<any>) => {
        this.pagos = res.content;
        this.totalRecords = res.totalElements;
        this.loading = false;
        this.cdr.detectChanges();
        this.appRef.tick();
      },
      error: () => this.loading = false
    });
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  resetFilters(): void {
    this.filterTipo = '';
    this.filterMetodo = '';
    this.filterInicio = null;
    this.filterFin = null;
    this.searchTerm = '';
    this.page = 0;
    this.loadPagos();
  }

  loadCaja(): void {
    this.cajaService.obtenerActual().subscribe({
      next: res => { this.cajaActual = res.data; this.cdr.detectChanges(); this.appRef.tick(); this.procesarStateNavegacion(); }
    });
  }

  private cargarDeudaParaPago(hospedajeId: number): void {
    this.hospedajeService.obtenerPorId(hospedajeId).subscribe({
      next: res => {
        const h = res.data;
        if (h && h.deudaPendiente && h.deudaPendiente > 0) {
          this.abrirCobrar(h);
        }
      }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadPagos();
  }

  onPageChange(event: any): void {
    this.page = event.page;
    this.pageSize = event.rows;
    this.loadPagos();
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.page = 0;
    this.loadPagos();
  }

  registrarGasto(): void {
    if (!this.gastoConcepto.trim() || this.gastoMonto <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Complete concepto y monto del gasto' });
      return;
    }
    this.loadingGasto = true;
    this.egresoService.registrar({
      concepto: this.gastoConcepto.trim(),
      categoria: this.gastoCategoria,
      monto: this.gastoMonto
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto registrado' });
        this.loadingGasto = false;
        this.gastoConcepto = '';
        this.gastoMonto = 0;
        this.loadAllEgresos();
        this.estadoActualizacion.pagoCambio();
      },
      error: (err) => { this.loadingGasto = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al registrar gasto' }); }
    });
  }

  showDialog(): void {
    this.pagoTipo = 'SALDO';
    this.pagoMonto = 0;
    this.pagoMetodo = 'EFECTIVO';
    this.pagoReferencia = '';
    this.pagoReservaId = null;
    this.pagoHospedajeId = null;
    this.pagoObservacion = '';
    this.pagoReservaObj = null;
    this.pagoHospedajeObj = null;
    this.dialogVisible = true;
    this.layoutState.setOverlay(true);
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.layoutState.setOverlay(false);
    this.pagoReservaObj = null;
    this.pagoHospedajeObj = null;
    this.reservasBuscadas = [];
    this.hospedajesBuscados = [];
  }

  buscarReservas(event: any): void {
    const query = event.query?.trim();
    if (!query) { this.reservasBuscadas = []; return; }
    this.reservaService.search(query).subscribe({
      next: res => {
        const data = res.data || [];
        this.reservasBuscadas = data.map((r: any) => ({
          ...r,
          label: `#${r.id} - ${r.clienteNombre || ''} (${r.fechaEntrada ? r.fechaEntrada.substring(0,10) : ''})`
        }));
      },
      error: () => this.reservasBuscadas = []
    });
  }

  onReservaSelect(event: any): void {
    this.pagoReservaId = event?.value?.id || null;
  }

  buscarHospedajes(event: any): void {
    const query = event.query?.trim();
    if (!query) { this.hospedajesBuscados = []; return; }
    this.hospedajeService.search(query).subscribe({
      next: res => {
        const data = res.data || [];
        this.hospedajesBuscados = data.map((h: any) => ({
          ...h,
          label: `#${h.id} - ${h.clienteNombre || ''} - Hab ${h.habitacionNumero || ''}`
        }));
      },
      error: () => this.hospedajesBuscados = []
    });
  }

  onHospedajeSelect(event: any): void {
    this.pagoHospedajeId = event?.value?.id || null;
  }

  savePago(): void {
    if (this.pagoMonto <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El monto debe ser mayor a cero' });
      return;
    }
    this.loadingPago = true;
    this.pagoService.registrar({
      tipo: this.pagoTipo,
      monto: this.pagoMonto,
      metodo: this.pagoMetodo,
      referencia: this.pagoReferencia || null,
      reservaId: this.pagoReservaId,
      hospedajeId: this.pagoHospedajeId,
      observacion: this.pagoObservacion || null
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pago registrado' });
        this.dialogVisible = false;
        this.layoutState.setOverlay(false);
        this.loadingPago = false;
        this.loadAllPagos();
        this.loadPagos();
        this.estadoActualizacion.pagoCambio();
        this.estadoActualizacion.hospedajeCambio();
        this.estadoActualizacion.reservaCambio();
      },
      error: (err) => { this.loadingPago = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al registrar pago' }); }
    });
  }

  toggleCierreModal(): void {
    this.showCierreModal = !this.showCierreModal;
    if (this.showCierreModal) {
      this.cierreMontoFisico = this.totalEfectivo;
      this.cierreObservacion = '';
      this.layoutState.setOverlay(true);
    } else {
      this.layoutState.setOverlay(false);
    }
  }

  confirmarCierre(): void {
    if (!this.cajaActual) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'No hay una caja abierta' });
      return;
    }
    this.loading = true;
    this.cajaService.cerrar(this.cajaActual.id, {
      montoFisicoEfectivo: this.cierreMontoFisico || null,
      observacion: this.cierreObservacion || null
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cierre de caja realizado' });
        this.showCierreModal = false;
        this.layoutState.setOverlay(false);
        this.loading = false;
        this.cajaActual = null;
        this.loadCaja();
        this.estadoActualizacion.pagoCambio();
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error en cierre de caja' }); }
    });
  }

  abrirCaja(): void {
    this.cajaService.abrir({ montoInicial: 0 }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Caja abierta' });
        this.loadCaja();
        this.estadoActualizacion.pagoCambio();
      },
      error: (err) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al abrir caja' }); }
    });
  }
}
