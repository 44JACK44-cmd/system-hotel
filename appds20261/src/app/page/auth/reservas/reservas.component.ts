import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ReservaService } from '../../../observable/reserva.service';
import { ClienteService } from '../../../observable/cliente.service';
import { HabitacionService } from '../../../observable/habitacion.service';
import { HospedajeService } from '../../../observable/hospedaje.service';
import { AuthService } from '../../../observable/auth.service';
import { PagoService } from '../../../observable/pago.service';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, filter } from 'rxjs';
import { PageResponse } from '../../../shared/models';
import { LayoutStateService } from '../../../services/layout-state.service';
import { BoletoService, moneda } from '../../../services/boleto.service';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule, SelectModule, AutoCompleteModule, PaginatorModule, InputNumberModule, DatePickerModule, TooltipModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.css']
})
export class ReservasComponent implements OnInit, OnDestroy {
  private reservaService = inject(ReservaService);
  private clienteService = inject(ClienteService);
  private habService = inject(HabitacionService);
  private hospedajeService = inject(HospedajeService);
  private pagoService = inject(PagoService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);
  private layoutState = inject(LayoutStateService);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private route = inject(ActivatedRoute);
  private estadoActualizacion = inject(EstadoActualizacionService);
  private boletoSvc = inject(BoletoService);
  private router = inject(Router);

  private accionPendiente: { entidadId?: number; accion?: string; cantidad?: number } | null = null;

  reservas: any[] = [];
  searchTerm = '';
  clientes: any[] = [];
  clientesBuscados: any[] = [];
  habitaciones: any[] = [];
  newDialogVisible = false;
  detailVisible = false;
  selectedReserva: any = null;
  loading = false;
  editMode = false;
  editReservaId: number | null = null;

  /* Server-side pagination */
  page = 0;
  pageSize = 20;
  totalRecords = 0;
  sortField = '';
  sortDir: 'asc' | 'desc' = 'asc';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  get isAdmin(): boolean { return this.authService.isAdmin(); }

  clienteSeleccionado: any = null;
  today = new Date();
  metodosPago = [
    { label: 'EFECTIVO', value: 'EFECTIVO' },
    { label: 'YAPE', value: 'YAPE' }
  ];

  reservaForm = this.fb.group({
    clienteId: [null as number | null, Validators.required],
    habitacionId: [null, Validators.required],
    fechaEntrada: [null, Validators.required],
    fechaSalida: [null, Validators.required],
    montoAdelanto: [0, [Validators.required, Validators.min(0.01)]],
    metodoAdelanto: ['YAPE', Validators.required],
    referenciaPago: ['', Validators.maxLength(100)],
    observacion: ['', Validators.maxLength(500)]
  }, { validators: this.fechaReservaValidator });

  private fechaReservaValidator(form: any): { [key: string]: any } | null {
    const entrada = form.get('fechaEntrada')?.value;
    const salida = form.get('fechaSalida')?.value;
    if (!entrada || !salida) return null;
    const e = new Date(entrada);
    const s = new Date(salida);
    if (s <= e) return { salidaMenorOIgual: true };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (e < hoy) return { entradaPasada: true };
    return null;
  }

  ngOnInit(): void {
    this.loadReservas();
    this.loadHabitaciones();
    this.loadClientes();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => { this.page = 0; this.loadReservas(); });
    this.route.queryParams.subscribe(params => {
      const clienteId = params['clienteId'];
      if (clienteId) {
        this.clienteService.obtenerPorId(Number(clienteId)).subscribe({
          next: (res) => {
            if (res.data) {
              const c = res.data;
              this.clienteSeleccionado = c;
              this.showNewDialog(c);
            }
          }
        });
      }
    });
    this.estadoActualizacion.on('RESERVA_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.loadReservas());
    this.estadoActualizacion.on('HABITACION_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.loadHabitaciones());

    // Detectar navegación con state usando router.events
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => this.procesarStateNavegacion());
  }

  private procesarStateNavegacion(): void {
    const state = window.history.state as { entidadId?: number; accion?: string; cantidad?: number } | undefined;
    console.log('[ALERTAS] Reservas - State recibido:', state);
    if (state?.accion) {
      if (this.loading || this.reservas.length === 0) {
        console.log('[ALERTAS] Reservas - Datos no listos, encolando acción...');
        this.accionPendiente = state;
      } else {
        console.log('[ALERTAS] Reservas - Datos listos, ejecutando acción...');
        this.ejecutarAccionInicial(state);
        this.limpiarStateNavegacion();
      }
    }
  }

  private ejecutarAccionInicial(state: { entidadId?: number; accion?: string; cantidad?: number }): void {
    console.log('[ALERTAS] Reservas - Ejecutando acción:', state);
    switch (state.accion) {
      case 'checkin-todos':
        this.messageService.add({
          severity: 'info',
          summary: 'Check-Ins',
          detail: `${state.cantidad || 1} check-in(s) pendiente(s). Filtre por fecha de entrada de hoy.`
        });
        break;
      default:
        console.log('[ALERTAS] Reservas - Acción no reconocida:', state.accion);
    }
    this.accionPendiente = null;
  }

  private limpiarStateNavegacion(): void {
    window.history.replaceState({}, '', window.location.pathname);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  loadReservas(): void {
    this.loading = true;
    this.reservaService.listarPaginado(this.page, this.pageSize, this.sortField || undefined, this.sortDir, this.searchTerm || undefined).subscribe({
      next: (res: PageResponse<any>) => {
        this.reservas = res.content;
        this.totalRecords = res.totalElements;
        this.loading = false;
        this.cdr.detectChanges();
        this.appRef.tick();
        this.procesarStateNavegacion();
      },
      error: () => { this.loading = false; this.procesarStateNavegacion(); }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(event: any): void {
    this.page = event.page;
    this.pageSize = event.rows;
    this.loadReservas();
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.page = 0;
    this.loadReservas();
  }

  loadHabitaciones(): void {
    this.habService.listarActivas().subscribe(res => {
      this.habitaciones = (res.data || []).filter((h: any) => h.estado === 'DISPONIBLE')
        .map((h: any) => ({ ...h, label: `${h.numero} - ${h.tipo} - S/${h.precioNoche}` }));
      this.cdr.detectChanges();
      this.appRef.tick();
    });
  }

  loadClientes(): void {
    this.clienteService.listarTodos().subscribe(res => { this.clientes = res.data || []; this.cdr.detectChanges(); this.appRef.tick(); });
  }

  closeDialog(): void {
    if (this.loading) return;
    this.editMode = false;
    this.editReservaId = null;
    this.newDialogVisible = false;
    this.layoutState.setOverlay(false);
  }

  closeDetail(): void {
    this.detailVisible = false;
    this.layoutState.setOverlay(false);
  }

  showNewDialog(cliente?: any): void {
    this.editMode = false;
    this.editReservaId = null;
    this.reservaForm.reset({ montoAdelanto: 0, metodoAdelanto: 'YAPE' });
    if (cliente) {
      this.clienteSeleccionado = cliente;
      this.reservaForm.patchValue({ clienteId: cliente.id });
    }
    this.newDialogVisible = true;
    this.layoutState.setOverlay(true);
  }

  showEditDialog(r: any): void {
    this.editMode = true;
    this.editReservaId = r.id;
    this.reservaForm.patchValue({
      habitacionId: r.habitacionId,
      fechaEntrada: r.fechaEntrada,
      fechaSalida: r.fechaSalida,
      observacion: r.observacion || ''
    });
    this.newDialogVisible = true;
    this.layoutState.setOverlay(true);
  }

  buscarClientes(event: any): void {
    const query = event?.query?.trim() || '';
    if (!query || query.length < 1) return;
    this.clienteService.buscar(query).subscribe({
      next: (res) => {
        this.clientesBuscados = (res.data || []).map((c: any) => ({
          ...c,
          nombreCompleto: c.nombreCompleto || `${c.documento || ''} ${c.email || ''}`.trim() || 'Sin nombre'
        }));
      },
      error: () => this.clientesBuscados = []
    });
  }

  onClienteSelect(event: any): void {
    const cliente = event?.value;
    if (cliente) {
      this.reservaForm.patchValue({ clienteId: cliente.id });
    }
  }

  searchCliente(): void {
    this.messageService.add({ severity: 'info', summary: 'Buscar cliente', detail: 'Escriba nombre, DNI, email o teléfono en el campo de búsqueda' });
  }

  saveReserva(): void {
    if (this.editMode) {
      const fe = this.reservaForm.get('fechaEntrada')?.value;
      const fs = this.reservaForm.get('fechaSalida')?.value;
      const habId = this.reservaForm.get('habitacionId')?.value;
      if (!habId || !fe || !fs) {
        this.messageService.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'Complete habitación, fecha entrada y fecha salida' });
        return;
      }
      const diff = new Date(fs).getTime() - new Date(fe).getTime();
      const noches = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (noches <= 0) {
        this.messageService.add({ severity: 'error', summary: 'Fechas inválidas', detail: 'La fecha de salida debe ser posterior a la fecha de entrada' });
        return;
      }
      this.updateReserva();
      return;
    }
    if (this.reservaForm.invalid) {
      if (this.reservaForm.errors?.['salidaMenorOIgual']) {
        this.messageService.add({ severity: 'error', summary: 'Fechas inválidas', detail: 'La fecha de salida debe ser posterior a la fecha de entrada' });
      } else if (this.reservaForm.errors?.['entradaPasada']) {
        this.messageService.add({ severity: 'error', summary: 'Fecha inválida', detail: 'La fecha de entrada no puede estar en el pasado' });
      } else {
        this.messageService.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'Complete todos los campos requeridos' });
      }
      return;
    }
    const data = this.reservaForm.value;
    this.loading = true;
    this.reservaService.verificarDisponibilidad(data.habitacionId!, data.fechaEntrada!, data.fechaSalida!).subscribe({
      next: (disp) => {
        if (!disp.data) {
          this.loading = false;
          this.messageService.add({ severity: 'warn', summary: 'No disponible', detail: 'La habitación no está disponible en esas fechas' });
          return;
        }
        const toDateStr = (d: any): string => {
          if (d instanceof Date) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          }
          return d;
        };
        this.reservaService.crear({
          clienteId: data.clienteId,
          habitacionId: data.habitacionId,
          fechaEntrada: toDateStr(data.fechaEntrada),
          fechaSalida: toDateStr(data.fechaSalida),
          montoAdelanto: data.montoAdelanto,
          metodoAdelanto: data.metodoAdelanto,
          referenciaPago: data.referenciaPago || null,
          observacion: data.observacion || null
        }).subscribe({
          next: () => {
            this.loading = false;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva creada' });
            this.newDialogVisible = false;
            this.layoutState.setOverlay(false);
            this.loadReservas();
            this.estadoActualizacion.reservaCambio();
            this.estadoActualizacion.habitacionCambio();
          },
          error: (err) => {
            this.loading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error al crear reserva' });
          }
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al verificar disponibilidad. Intente nuevamente.' });
      }
    });
  }

  updateReserva(): void {
    if (!this.editReservaId) return;
    const data = this.reservaForm.value;
    this.loading = true;
    this.reservaService.actualizar(this.editReservaId, {
      habitacionId: data.habitacionId,
      fechaEntrada: data.fechaEntrada,
      fechaSalida: data.fechaSalida,
      observacion: data.observacion || null
    }).subscribe({
      next: () => {
        this.loading = false;
        this.editMode = false;
        this.editReservaId = null;
        this.newDialogVisible = false;
        this.layoutState.setOverlay(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva actualizada correctamente' });
        this.loadReservas();
        this.estadoActualizacion.reservaCambio();
        this.estadoActualizacion.habitacionCambio();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error al actualizar reserva' });
      }
    });
  }

  showDetail(r: any): void {
    this.selectedReserva = r;
    this.detailVisible = true;
    this.layoutState.setOverlay(true);
  }

  getReservaBadge(estado: string): string {
    const map: Record<string, string> = {
      CONFIRMADA: 'badge-confirmed',
      PENDIENTE: 'badge-pending',
      CANCELADA: 'badge-cancelled',
      NO_SHOW: 'badge-error',
      CONCRETADA: 'badge-success'
    };
    return map[estado] || 'badge-info';
  }

  cancelReserva(r: any): void {
    if (!this.isAdmin) {
      this.messageService.add({ severity: 'error', summary: 'RN-12', detail: 'Solo el ADMIN puede cancelar reservas' });
      return;
    }
    this.confirmationService.confirm({
      message: 'Seguro de cancelar esta reserva? El adelanto no se devuelve.',
      accept: () => {
        this.reservaService.cancelar(r.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Cancelada', detail: 'Reserva cancelada' }); this.loadReservas(); this.estadoActualizacion.reservaCambio(); this.estadoActualizacion.habitacionCambio(); },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error' })
        });
      }
    });
  }

  /* ---- Acciones extendidas ---- */

  copiarReserva(r: any): void {
    const texto =
      `RESERVA #${r.id}\n` +
      `Cliente: ${r.clienteNombre}\n` +
      `Tel: ${r.clienteTelefono || 'N/A'}\n` +
      `Habitación: ${r.habitacionNumero} (${r.habitacionTipo || ''})\n` +
      `Entrada: ${this.fmtFecha(r.fechaEntrada)}\n` +
      `Salida: ${this.fmtFecha(r.fechaSalida)}\n` +
      `Total: S/ ${r.montoTotal}\n` +
      `Adelanto: S/ ${r.montoAdelanto}\n` +
      `Estado: ${r.estado}`;
    navigator.clipboard.writeText(texto).then(
      () => this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Datos de la reserva copiados' }),
      () => this.messageService.add({ severity: 'info', summary: 'Copiado', detail: 'Datos disponibles' })
    );
  }

  imprimirReserva(r: any): void {
    const noct = this.diasEntre(r.fechaEntrada, r.fechaSalida) || 1;
    this.boletoSvc.abrirComprobante({
      tipoDocumento: 'BOLETO',
      numero: String(r.id).padStart(6, '0'),
      hospedajeId: r.id,
      recepcionista: this.authService.getNombreCompleto() || r.usuarioNombre || '',
      cliente: [
        { label: 'Nombre completo', value: r.clienteNombre },
        { label: 'Teléfono', value: r.clienteTelefono },
        { label: 'Documento', value: r.clienteDocumento || null },
      ],
      hospedaje: [
        { label: 'Habitación', value: r.habitacionNumero },
        { label: 'Tipo', value: r.habitacionTipo },
        { label: 'Entrada', value: this.fmtFecha(r.fechaEntrada) },
        { label: 'Salida', value: this.fmtFecha(r.fechaSalida) },
        { label: 'Noches', value: noct },
        { label: 'Estado', value: r.estado },
      ],
      habitacion: [
        { label: 'Número', value: r.habitacionNumero },
        { label: 'Tipo', value: r.habitacionTipo },
        { label: 'Precio por noche', value: moneda(r.habitacionPrecio) },
      ],
      detalle: [
        { concepto: 'Reserva de habitación', cantidad: noct, precioUnitario: r.habitacionPrecio, subtotal: r.montoTotal || (r.habitacionPrecio * noct) },
      ],
      consumos: [],
      totalConsumos: 0,
      pagos: [],
      resumen: [
        { label: 'Subtotal reserva', value: moneda(r.montoTotal) },
        { label: 'Adelanto', value: moneda(r.montoAdelanto) },
        { label: 'TOTAL GENERAL', value: moneda(r.montoTotal) },
        { label: 'Saldo por adelantar', value: moneda((r.montoTotal || 0) - (r.montoAdelanto || 0)) },
      ],
      observaciones: r.observacion,
      pie: 'Gracias por su preferencia'
    });
  }

  /* Pago / Check-in desde la fila */
  accionReserva: any = null;
  accionTipo: 'pago' | 'checkin' | null = null;
  accionMonto = 0;
  accionMetodo = 'EFECTIVO';
  accionReferencia = '';
  accionLoading = false;

  registrarPagoReserva(r: any): void {
    this.accionReserva = r;
    this.accionTipo = 'pago';
    this.accionMonto = 0;
    this.accionMetodo = 'EFECTIVO';
    this.accionReferencia = '';
    this.accionLoading = false;
  }

  checkInReserva(r: any): void {
    this.accionReserva = r;
    this.accionTipo = 'checkin';
    this.accionMonto = 0;
    this.accionMetodo = 'EFECTIVO';
    this.accionReferencia = '';
  }

  confirmarAccionReserva(): void {
    if (!this.accionReserva || !this.accionTipo) return;
    const r = this.accionReserva;
    if (this.accionTipo === 'pago') {
      if (this.accionMonto <= 0) {
        this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese un monto mayor a cero' });
        return;
      }
      this.accionLoading = true;
      this.pagoService.registrar({
        tipo: 'ADELANTO',
        monto: this.accionMonto,
        metodo: this.accionMetodo,
        referencia: this.accionReferencia || null,
        reservaId: r.id,
        observacion: 'Pago desde Gestión de Reservas'
      }).subscribe({
        next: () => {
          this.accionLoading = false;
          this.messageService.add({ severity: 'success', summary: 'Pago registrado', detail: 'El pago se registró correctamente' });
          this.accionTipo = null; this.accionReserva = null;
          this.layoutState.setOverlay(false);
          this.loadReservas();
          this.estadoActualizacion.pagoCambio();
        },
        error: (err) => {
          this.accionLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error al registrar pago' });
        }
      });
    } else {
      this.accionLoading = true;
      this.hospedajeService.checkIn({
        reservaId: r.id,
        montoSaldo: this.accionMonto || null,
        metodoSaldo: this.accionMonto ? this.accionMetodo : null,
        referencia: this.accionReferencia || null
      }).subscribe({
        next: () => {
          this.accionLoading = false;
          this.messageService.add({ severity: 'success', summary: 'Check-in', detail: `Reserva convertida a hospedaje` });
          this.accionTipo = null; this.accionReserva = null;
          this.layoutState.setOverlay(false);
          this.loadReservas();
          this.estadoActualizacion.reservaCambio();
          this.estadoActualizacion.habitacionCambio();
          this.estadoActualizacion.hospedajeCambio();
        },
        error: (err) => {
          this.accionLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error en check-in' });
        }
      });
    }
  }

  cerrarAccionReserva(): void {
    this.accionTipo = null;
    this.accionReserva = null;
    this.layoutState.setOverlay(false);
  }

  private fmtFecha(d: any): string {
    if (!d) return 'N/A';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  private diasEntre(a: any, b: any): number {
    if (!a || !b) return 1;
    const d1 = new Date(a).getTime();
    const d2 = new Date(b).getTime();
    if (isNaN(d1) || isNaN(d2)) return 1;
    const diff = Math.round((d2 - d1) / 86400000);
    return Math.max(1, diff);
  }
}
