import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HospedajeService } from '../../../observable/hospedaje.service';
import { ConsumoService, ConsumoResponse } from '../../../observable/consumo.service';
import { ClienteService } from '../../../observable/cliente.service';
import { HabitacionService } from '../../../observable/habitacion.service';
import { IncidenciaService } from '../../../observable/incidencia.service';
import { ReservaService } from '../../../observable/reserva.service';
import { PagoService } from '../../../observable/pago.service';
import { AuthService } from '../../../observable/auth.service';
import { BoletoService, fmtFecha, moneda } from '../../../services/boleto.service';
import { CheckOutComponent } from '../../../components/checkout/checkout.component';
import { ConsumoModalComponent } from '../../../components/consumo-modal/consumo-modal.component';
import { ClienteQuickCreateComponent } from '../../../components/cliente-quick-create/cliente-quick-create.component';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError, takeUntil, forkJoin } from 'rxjs';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';


@Component({
  selector: 'app-hospedajes',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, SelectModule, AutoCompleteModule, InputNumberModule, DatePickerModule, TooltipModule, ConfirmDialogModule, CheckOutComponent, ConsumoModalComponent, ClienteQuickCreateComponent],
  providers: [MessageService, ConfirmationService],
  templateUrl: './hospedajes.component.html',
  styleUrls: ['./hospedajes.component.css']
})
export class HospedajesComponent implements OnInit, OnDestroy {
  private hospedajeService = inject(HospedajeService);
  private consumoService = inject(ConsumoService);
  private clienteService = inject(ClienteService);
  private habService = inject(HabitacionService);
  private incidenciaService = inject(IncidenciaService);
  private reservaService = inject(ReservaService);
  private pagoService = inject(PagoService);
  private authService = inject(AuthService);
  private boletoSvc = inject(BoletoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private estadoActualizacion = inject(EstadoActualizacionService);
  private router = inject(Router);

  // Cola de acciones pendientes
  private accionPendiente: { entidadId?: number; accion?: string } | null = null;

  activeTab = 'activos';
  loading = false;
  hospedajes: any[] = [];
  clientes: any[] = [];
  habitacionesDisponibles: any[] = [];
  totalHabitaciones = 0;

  selectedHospedajeId: number | null = null;
  detailHospedaje: any = null;

  showCheckoutPanel = false;
  showConsumoModal = false;
  editConsumo: ConsumoResponse | null = null;

  consumos: ConsumoResponse[] = [];
  totalConsumos = 0;
  loadingConsumos = false;

  extensionFecha: Date | null = null;
  loadingExtension = false;

  nuevaHabitacionId: number | null = null;
  loadingCambio = false;

  checkInReservaId: number | null = null;
  checkInReservaObj: any = null;
  reservasBuscadasCheckIn: any[] = [];
  checkInMontoSaldo = 0;
  checkInMetodo = 'EFECTIVO';
  loadingCheckIn = false;

  directoCliente: any = null;
  clientesFiltrados: any[] = [];
  buscarClientesLoading = false;
  directoHabitacionId: number | null = null;
  directoNoches = 1;
  directoMontoPago = 0;
  directoMetodo = 'EFECTIVO';
  loadingDirecto = false;
  showQuickCreateCliente = false;

  filterText = '';
  filteredHospedajes: any[] = [];
  incidenciasLimpieza: any[] = [];
  proximosCheckIns: any[] = [];

  /* Sort */
  sortField = '';
  sortDir: 'asc' | 'desc' = 'asc';

  get sortedHospedajes(): any[] {
    let list = this.filteredHospedajes;
    if (this.sortField) {
      list = [...list].sort((a, b) => {
        let va: string, vb: string;
        if (this.sortField === 'deudaPendiente') {
          va = String(a[this.sortField] || 0);
          vb = String(b[this.sortField] || 0);
        } else {
          va = (a[this.sortField] || '').toString().toLowerCase();
          vb = (b[this.sortField] || '').toString().toLowerCase();
        }
        return this.sortDir === 'asc' ? va.localeCompare(vb, undefined, { numeric: true }) : vb.localeCompare(va, undefined, { numeric: true });
      });
    }
    return list;
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
  }

  private filterSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private clienteSearchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadActivos();
    this.loadClientes();
    this.loadHabitaciones();
    this.loadIncidenciasLimpieza();
    this.loadProximosCheckIns();
    this.filterSubject.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(() => this.applyFilter());
    this.clienteSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.clienteService.buscar(q).pipe(
        catchError(() => of({ data: [] as any[] }))
      )),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.buscarClientesLoading = false;
      this.clientesFiltrados = (res.data || []).map((c: any) => ({
        ...c,
        nombreCompleto: c.nombreCompleto || `${c.documento || ''} ${c.email || ''}`.trim() || 'Sin nombre'
      }));
    });
    this.estadoActualizacion.on('HABITACION_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadHabitaciones();
      this.loadIncidenciasLimpieza();
    });
    this.estadoActualizacion.on('HOSPEDAJE_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadActivos();
      this.loadProximosCheckIns();
    });
    this.estadoActualizacion.on('RESERVA_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadProximosCheckIns();
    });
    this.estadoActualizacion.on('CONSUMO_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event.data?.hospedajeId === this.selectedHospedajeId) this.onConsumoSaved();
    });
    this.estadoActualizacion.on('INCIDENCIA_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.loadIncidenciasLimpieza());
    this.estadoActualizacion.on('CLIENTE_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.loadClientes());

    // Detectar navegación con state usando router.events (más confiable que getCurrentNavigation)
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      console.log('[ALERTAS] Hospedajes - NavigationEnd detectado');
      this.procesarStateNavegacion();
    });
  }

  private procesarStateNavegacion(): void {
    const state = window.history.state as { entidadId?: number; accion?: string } | undefined;
    console.log('[ALERTAS] Hospedajes - State recibido:', state);
    if (state?.entidadId || state?.accion) {
      if (this.loading || this.hospedajes.length === 0) {
        console.log('[ALERTAS] Hospedajes - Datos no listos, encolando acción...');
        this.accionPendiente = state;
      } else {
        console.log('[ALERTAS] Hospedajes - Datos listos, ejecutando acción...');
        this.ejecutarAccionInicial(state);
        this.limpiarStateNavegacion();
      }
    }
  }

  private limpiarStateNavegacion(): void {
    window.history.replaceState({}, '', window.location.pathname);
  }

  private ejecutarAccionInicial(state: { entidadId?: number; accion?: string; entidades?: number[] }): void {
    console.log('[ALERTAS] Hospedajes - Ejecutando acción:', state);
    if (!state?.accion) return;
    switch (state.accion) {
      case 'checkout':
      case 'Realizar Check-Out':
      case 'Abrir Check-Out':
        if (state.entidadId) {
          console.log('[ALERTAS] Hospedajes - Llamando showCheckoutFor(', state.entidadId, ')');
          this.showCheckoutFor(state.entidadId);
        }
        break;
      case 'pago':
      case 'Registrar Pago':
        if (state.entidadId) {
          console.log('[ALERTAS] Hospedajes - Llamando selectHospedaje(', state.entidadId, ') para pago');
          this.selectHospedaje(state.entidadId);
        }
        break;
      case 'checkout-todos':
        if (state.entidades?.length) {
          console.log('[ALERTAS] Hospedajes - checkout-todos, abriendo primero de', state.entidades.length);
          this.showCheckoutFor(state.entidades[0]);
          this.messageService.add({ severity: 'info', summary: 'Check-Outs', detail: `${state.entidades.length} hospedaje(s) con check-out pendiente` });
        }
        break;
      case 'checkin-todos':
        console.log('[ALERTAS] Hospedajes - checkin-todos: redirigiendo a Reservas');
        this.router.navigate(['/recepcion/reservas'], { state: { accion: 'checkin-todos' } });
        break;
      case 'directo':
        console.log('[ALERTAS] Hospedajes - directo: abriendo pestaña Ingreso Directo');
        this.activeTab = 'directo';
        break;
      default:
        if (state.entidadId) {
          console.log('[ALERTAS] Hospedajes - Acción por defecto: selectHospedaje(', state.entidadId, ')');
          this.selectHospedaje(state.entidadId);
        }
    }
    this.accionPendiente = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.filterSubject.complete();
  }

  onFilterInput(): void {
    this.filterSubject.next(this.filterText);
  }

  applyFilter(): void {
    if (!this.filterText.trim()) { this.filteredHospedajes = [...this.hospedajes]; return; }
    const t = this.filterText.toLowerCase();
    this.filteredHospedajes = this.hospedajes.filter(h =>
      (h.clienteNombre || '').toLowerCase().includes(t) ||
      (h.habitacionNumero || '').toLowerCase().includes(t)
    );
  }

  loadActivos(): void {
    this.loading = true;
    this.hospedajeService.listarActivos().subscribe({
      next: res => { this.hospedajes = res.data || []; this.filteredHospedajes = [...this.hospedajes]; this.loading = false; this.cdr.detectChanges(); this.appRef.tick(); this.procesarStateNavegacion(); },
      error: () => { this.loading = false; this.procesarStateNavegacion(); }
    });
  }

  loadClientes(): void {
    this.clienteService.listarTodos().subscribe({
      next: res => { this.clientes = res.data || []; this.cdr.detectChanges(); this.appRef.tick(); }
    });
  }

  loadHabitaciones(): void {
    this.habService.listarActivas().subscribe(res => {
      const todas = res.data || [];
      this.totalHabitaciones = todas.length;
      this.habitacionesDisponibles = todas
        .filter((h: any) => h.estado === 'DISPONIBLE')
        .map((h: any) => ({ ...h, label: `${h.numero} - ${h.tipo} - S/${h.precioNoche}` }));
      this.cdr.detectChanges();
      this.appRef.tick();
    });
  }

  loadIncidenciasLimpieza(): void {
    this.incidenciaService.listarActivas().subscribe({
      next: res => {
        this.incidenciasLimpieza = (res.data || []).filter((i: any) => i.tipo === 'LIMPIEZA_CHECKOUT' || i.tipo === 'LIMPIEZA');
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    });
  }

  loadProximosCheckIns(): void {
    this.reservaService.listarDelDia().subscribe({
      next: res => {
        this.proximosCheckIns = (res.data || []).filter((r: any) => r.estado === 'CONFIRMADA');
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    });
  }

  getTiempoTranscurrido(fecha: string): string {
    if (!fecha) return '';
    const ahora = new Date().getTime();
    const inicio = new Date(fecha).getTime();
    const diffMin = Math.floor((ahora - inicio) / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const horas = Math.floor(diffMin / 60);
    if (horas < 24) return `Hace ${horas}h`;
    return `Hace ${Math.floor(horas / 24)}d`;
  }

  selectHospedaje(id: number): void {
    this.selectedHospedajeId = id;
    this.hospedajeService.obtenerPorId(id).subscribe({
      next: res => {
        this.detailHospedaje = res.data;
        this.loadConsumos(id);
      }
    });
  }

  clearSelection(): void {
    this.selectedHospedajeId = null;
    this.detailHospedaje = null;
    this.consumos = [];
    this.totalConsumos = 0;
    this.extensionFecha = null;
    this.nuevaHabitacionId = null;
  }

  showCheckout(): void {
    this.showCheckoutPanel = true;
  }

  closeCheckout(): void {
    this.showCheckoutPanel = false;
    this.selectedHospedajeId = null;
    this.loadActivos();
  }

  loadConsumos(hospedajeId: number): void {
    this.loadingConsumos = true;
    this.consumoService.listarPorHospedaje(hospedajeId).subscribe({
      next: res => {
        this.consumos = res.data || [];
        this.totalConsumos = this.consumos.reduce((s, c) => s + (c.subtotal || 0), 0);
        this.loadingConsumos = false;
      },
      error: () => this.loadingConsumos = false
    });
  }

  abrirModalConsumo(): void {
    this.editConsumo = null;
    this.showConsumoModal = true;
  }

  editarConsumo(c: ConsumoResponse): void {
    this.editConsumo = c;
    this.showConsumoModal = true;
  }

  eliminarConsumo(id: number): void {
    this.confirmationService.confirm({
      message: '¿Eliminar este consumo?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.consumoService.eliminar(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Consumo eliminado' });
            this.loadConsumos(this.selectedHospedajeId!);
            if (this.selectedHospedajeId) this.selectHospedaje(this.selectedHospedajeId);
            this.estadoActualizacion.consumoCambio({ hospedajeId: this.selectedHospedajeId });
            this.estadoActualizacion.hospedajeCambio({ hospedajeId: this.selectedHospedajeId });
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error al eliminar consumo' })
        });
      }
    });
  }

  onConsumoSaved(): void {
    this.loadConsumos(this.selectedHospedajeId!);
    if (this.selectedHospedajeId) this.selectHospedaje(this.selectedHospedajeId);
  }

  extenderEstadia(): void {
    if (!this.selectedHospedajeId || !this.extensionFecha) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione una nueva fecha de salida' });
      return;
    }
    const actual = this.detailHospedaje?.fechaSalidaProgramada ? new Date(this.detailHospedaje.fechaSalidaProgramada) : null;
    const nueva = new Date(this.extensionFecha);
    if (actual && nueva <= actual) {
      this.messageService.add({ severity: 'error', summary: 'Fecha inválida', detail: 'La nueva fecha de salida debe ser posterior a la fecha de salida programada' });
      return;
    }
    this.loadingExtension = true;
    this.hospedajeService.extenderEstadia(this.selectedHospedajeId, {
      nuevaFechaSalida: new Date(this.extensionFecha).toISOString()
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estadía extendida correctamente' });
        this.loadingExtension = false;
        this.extensionFecha = null;
        this.selectHospedaje(this.selectedHospedajeId!);
        this.loadActivos();
        this.estadoActualizacion.hospedajeCambio();
      },
      error: (err) => { this.loadingExtension = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error al extender' }); }
    });
  }

  cambiarHabitacion(): void {
    if (!this.selectedHospedajeId || !this.nuevaHabitacionId) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione una habitación' });
      return;
    }
    this.loadingCambio = true;
    this.hospedajeService.cambiarHabitacion(this.selectedHospedajeId, {
      nuevaHabitacionId: this.nuevaHabitacionId
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Habitación cambiada correctamente' });
        this.loadingCambio = false;
        this.nuevaHabitacionId = null;
        this.selectHospedaje(this.selectedHospedajeId!);
        this.loadActivos();
        this.estadoActualizacion.habitacionCambio();
        this.estadoActualizacion.hospedajeCambio();
        this.estadoActualizacion.incidenciaCambio();
        this.estadoActualizacion.notificacionCambio();
      },
      error: (err) => { this.loadingCambio = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error al cambiar habitación' }); }
    });
  }

  buscarReservasCheckIn(event: any): void {
    const valor = event.query?.trim() || '';
    if (!valor || valor.length < 2) { this.reservasBuscadasCheckIn = []; return; }
    this.reservaService.search(valor).subscribe({
      next: res => {
        this.reservasBuscadasCheckIn = (res.data || []).map((r: any) => ({
          ...r,
          label: `#${r.id} - ${r.clienteNombre || ''} - Hab ${r.habitacionNumero || ''}`
        }));
      },
      error: () => this.reservasBuscadasCheckIn = []
    });
  }

  onReservaCheckInSelect(event: any): void {
    const item = event?.value ?? event;
    this.checkInReservaId = item?.id || null;
  }

  doCheckIn(): void {
    if (!this.checkInReservaId) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione una reserva' });
      return;
    }
    this.loadingCheckIn = true;
    this.hospedajeService.checkIn({
      reservaId: this.checkInReservaId,
      montoSaldo: this.checkInMontoSaldo || 0,
      metodoSaldo: this.checkInMetodo
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Check-in realizado' });
        this.loadingCheckIn = false;
        this.checkInReservaId = null;
        this.checkInReservaObj = null;
        this.checkInMontoSaldo = 0;
        this.loadActivos();
        this.estadoActualizacion.habitacionCambio();
        this.estadoActualizacion.reservaCambio();
        this.estadoActualizacion.hospedajeCambio();
        this.estadoActualizacion.pagoCambio();
        this.estadoActualizacion.cajaCambio();
      },
      error: (err) => { this.loadingCheckIn = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error en check-in' }); }
    });
  }

  buscarClientes(event: any): void {
    const query = event?.query?.trim() || '';
    if (!query) {
      this.clientesFiltrados = [];
      this.buscarClientesLoading = false;
      return;
    }
    this.clienteSearchSubject.next(query);
    this.buscarClientesLoading = true;
  }

  onClienteDirectoSelect(event: any): void {
    this.directoCliente = event?.value ?? event;
  }

  abrirQuickCreateCliente(): void {
    this.showQuickCreateCliente = true;
  }

  onClienteCreado(cliente: any): void {
    this.showQuickCreateCliente = false;
    const clienteConLabel = { ...cliente, label: `${cliente.nombreCompleto} - ${cliente.documento || ''}` };
    this.directoCliente = clienteConLabel;
    this.clientesFiltrados = [clienteConLabel];
    this.estadoActualizacion.clienteCambio();
  }

  cerrarQuickCreateCliente(): void {
    this.showQuickCreateCliente = false;
  }

  doCheckInDirecto(): void {
    if (!this.directoCliente?.id || !this.directoHabitacionId) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione cliente y habitación' });
      return;
    }
    if (!this.directoNoches || this.directoNoches < 1 || this.directoNoches > 30) {
      this.messageService.add({ severity: 'error', summary: 'Validación', detail: 'Las noches deben estar entre 1 y 30' });
      return;
    }
    if (this.directoMontoPago < 0) {
      this.messageService.add({ severity: 'error', summary: 'Validación', detail: 'El monto de pago no puede ser negativo' });
      return;
    }
    this.loadingDirecto = true;
    this.hospedajeService.checkInDirecto({
      clienteId: this.directoCliente.id,
      habitacionId: this.directoHabitacionId,
      noches: this.directoNoches || 1,
      montoPago: this.directoMontoPago || 0,
      metodo: this.directoMetodo
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Check-in directo realizado' });
        this.loadingDirecto = false;
        this.directoCliente = null;
        this.directoHabitacionId = null;
        this.directoNoches = 1;
        this.directoMontoPago = 0;
        this.loadActivos();
        this.estadoActualizacion.habitacionCambio();
        this.estadoActualizacion.hospedajeCambio();
        this.estadoActualizacion.pagoCambio();
        this.estadoActualizacion.cajaCambio();
      },
      error: (err) => { this.loadingDirecto = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error en check-in directo' }); }
    });
  }

  formatFecha(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  showCheckoutFor(id: number): void {
    this.selectedHospedajeId = id;
    this.showCheckoutPanel = true;
  }

  imprimirComprobante(h: any): void {
    if (!h) return;
    const cargas: any[] = [
      this.pagoService.listarPorHospedaje(h.id),
      this.consumoService.listarPorHospedaje(h.id),
    ];
    if (h.clienteId) {
      cargas.push(this.clienteService.obtenerPorId(h.clienteId));
    }
    if (h.reservaId) {
      cargas.push(this.reservaService.obtenerPorId(h.reservaId));
    }

    forkJoin(cargas).subscribe({
      next: (res: any[]) => {
        const [pagosRes, consumosRes] = res;
        let cliente: any = null;
        if (h.clienteId) cliente = res[2]?.data;
        this.ensamblarComprobante(h, pagosRes?.data, consumosRes?.data, cliente || null);
      },
      error: () => this.ensamblarComprobante(h, [], [], null)
    });
  }

  private ensamblarComprobante(h: any, pagos: any[] | undefined, consumos: any[] | undefined, cliente: any): void {
    cliente = cliente || {};
    const noct = h.fechaIngreso ? Math.max(1, Math.round((new Date(h.fechaSalidaProgramada || h.fechaIngreso).getTime() - new Date(h.fechaIngreso).getTime()) / 86400000)) : 0;
    const precioNoche = Number(h.habitacionPrecio || 0);
    const subtotalHospedaje = precioNoche * noct;
    const subtotalConsumos = (consumos || []).reduce((s, c) => s + (c.subtotal || 0), 0);
    const totalGeneral = subtotalHospedaje + subtotalConsumos;
    const totalPagado = Number(h.totalPagado || 0);
    const saldoPendiente = Number(h.deudaPendiente || 0);

    this.boletoSvc.abrirComprobante({
      tipoDocumento: 'FACTURA',
      numero: String(h.id).padStart(6, '0'),
      hospedajeId: h.id,
      recepcionista: this.authService.getNombreCompleto() || h.usuarioNombre || '',
      cliente: [
        { label: 'Nombre completo', value: cliente.nombreCompleto || h.clienteNombre },
        { label: 'Documento', value: cliente.documento || null },
        { label: 'Tipo documento', value: cliente.tipoDocumento || null },
        { label: 'Teléfono', value: cliente.telefono || h.clienteTelefono },
        { label: 'Correo', value: cliente.email || null },
        { label: 'Estancias', value: cliente.totalEstancias || null },
        { label: 'Tipo cliente', value: cliente.lealtad || null },
      ],
      hospedaje: [
        { label: 'Habitación', value: h.habitacionNumero },
        { label: 'Tipo', value: h.habitacionTipo },
        { label: 'Piso', value: h.habitacionPiso },
        { label: 'Check-In', value: fmtFecha(h.fechaIngreso) },
        { label: 'Check-Out prog.', value: fmtFecha(h.fechaSalidaProgramada) },
        { label: 'Check-Out real', value: fmtFecha(h.fechaSalidaReal) },
        { label: 'Noches', value: noct },
        { label: 'Estado', value: h.estado },
      ],
      habitacion: [
        { label: 'Número', value: h.habitacionNumero },
        { label: 'Tipo', value: h.habitacionTipo },
        { label: 'Piso', value: h.habitacionPiso },
        { label: 'Precio por noche', value: moneda(precioNoche) },
      ],
      detalle: [
        { concepto: 'Alojamiento (' + noct + ' noche(s))', cantidad: noct, precioUnitario: precioNoche, subtotal: subtotalHospedaje },
      ],
      consumos: (consumos || []).map(c => ({
        fecha: c.fechaRegistro,
        producto: c.descripcion,
        cantidad: c.cantidad,
        precio: c.precioUnitario,
        subtotal: c.subtotal,
      })),
      totalConsumos: subtotalConsumos,
      pagos: (pagos || []).map(p => ({
        fecha: p.fechaPago,
        metodo: p.metodo,
        tipo: p.tipo,
        monto: p.monto,
        usuario: p.usuarioNombre,
      })),
      resumen: [
        { label: 'Subtotal hospedaje', value: moneda(subtotalHospedaje) },
        { label: 'Subtotal consumos', value: moneda(subtotalConsumos) },
        { label: 'Subtotal extensiones', value: moneda(0) },
        { label: 'Descuentos', value: moneda(0) },
        { label: 'Impuestos', value: moneda(0) },
        { label: 'TOTAL GENERAL', value: moneda(totalGeneral) },
        { label: 'Total pagado', value: moneda(totalPagado) },
        { label: 'Saldo pendiente', value: moneda(saldoPendiente) },
        { label: 'Cambio', value: moneda(0) },
      ],
      observaciones: h.observacion,
      categoria: '',
      pie: 'Gracias por hospedarse con nosotros. Esperamos verlo nuevamente.'
    });
  }

  getScheduledCheckouts(): number {
    return this.hospedajes.filter(h => {
      if (!h.fechaSalidaProgramada) return false;
      const diff = new Date(h.fechaSalidaProgramada).getTime() - new Date().getTime();
      return diff > 0 && diff < 86400000;
    }).length;
  }

  getTotalDeuda(): string {
    const total = this.hospedajes.reduce((s, h) => s + (h.deudaPendiente || 0), 0);
    return total.toFixed(2);
  }

  getOccupancyRate(): number {
    if (this.totalHabitaciones === 0) return 0;
    return Math.round((this.hospedajes.length / this.totalHabitaciones) * 100);
  }

  get costoDirectoTotal(): number {
    const hab = this.habitacionesDisponibles.find(h => h.id === this.directoHabitacionId);
    if (!hab || !this.directoNoches) return 0;
    return (hab.precioNoche || 0) * this.directoNoches;
  }

  get costoExtensionPreview(): number {
    if (!this.extensionFecha || !this.detailHospedaje) return 0;
    const actual = new Date(this.detailHospedaje.fechaSalidaProgramada);
    const nueva = new Date(this.extensionFecha);
    if (nueva <= actual) return 0;
    const diffMs = nueva.getTime() - actual.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const precio = this.detailHospedaje.habitacionPrecio || 0;
    return Math.max(0, diffDays) * precio;
  }

  formatFechaCorta(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}
