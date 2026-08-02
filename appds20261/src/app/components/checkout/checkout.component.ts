import { Component, inject, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HospedajeService } from '../../observable/hospedaje.service';
import { IncidenciaService } from '../../observable/incidencia.service';
import { ConsumoService, ConsumoResponse } from '../../observable/consumo.service';
import { PagoService } from '../../observable/pago.service';
import { ClienteService } from '../../observable/cliente.service';
import { AuthService } from '../../observable/auth.service';
import { AppConfigService } from '../../services/app-config.service';
import { BoletoService, fmtFecha, moneda } from '../../services/boleto.service';
import { ConsumoModalComponent } from '../consumo-modal/consumo-modal.component';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LayoutStateService } from '../../services/layout-state.service';
import { EstadoActualizacionService } from '../../services/estado-actualizacion.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, InputNumberModule, RadioButtonModule, AutoCompleteModule, TooltipModule, ToastModule, ConsumoModalComponent],
  providers: [MessageService],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckOutComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible = false;
  @Input() hospedajeId: number | null = null;
  @Output() close = new EventEmitter<void>();

  private router = inject(Router);
  private hospedajeService = inject(HospedajeService);
  private incidenciaService = inject(IncidenciaService);
  private consumoService = inject(ConsumoService);
  private pagoService = inject(PagoService);
  private clienteService = inject(ClienteService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private layoutState = inject(LayoutStateService);
  private configService = inject(AppConfigService);
  private boletoSvc = inject(BoletoService);
  protected cfg = this.configService.config;
  private estadoActualizacion = inject(EstadoActualizacionService);

  Math = Math;
  private dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  private meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  searchResults: any[] = [];
  hospedajeEncontrado: any = null;
  metodoPago = 'YAPE';
  fechaActual = new Date();
  esExtension = false;
  nochesExtra = 0;
  cargoExtension = 0;
  montoPago = 0;
  loading = false;

  showConsumoModal = false;
  consumos: ConsumoResponse[] = [];
  loadingConsumos = false;

  hotelData: any = { nombre: '', ruc: '', direccion: '', telefono: '' };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && !changes['visible'].firstChange) {
      const curr = !!changes['visible'].currentValue;
      const prev = !!changes['visible'].previousValue;
      if (curr && !prev) {
        this.layoutState.setOverlay(true);
      } else if (!curr && prev) {
        this.layoutState.setOverlay(false);
      }
    }
  }

  ngOnInit(): void {
    this.layoutState.setOverlay(true);
    if (this.hospedajeId && this.visible) {
      this.buscarHospedajePorId(this.hospedajeId);
    } else if (this.visible) {
      this.cargarHospedajesActivos();
    }
    this.configService.load();
    this.actualizarHotelData();
  }

  cargarHospedajesActivos(): void {
    this.hospedajeService.listarActivos().subscribe({
      next: (res) => {
        this.searchResults = (res.data || []).map((h: any) => ({
          ...h,
          displayLabel: `Hab ${h.habitacionNumero} - ${h.clienteNombre} (#${h.id})`
        }));
      }
    });
  }

  private actualizarHotelData(): void {
    const c = this.cfg();
    this.hotelData = {
      nombre: c.nombre,
      ruc: this.configService.get('hotel.ruc', ''),
      direccion: c.direccion,
      telefono: c.telefono,
    };
  }



  ngOnDestroy(): void {
    this.layoutState.setOverlay(false);
  }

  private buscarHospedajePorId(id: number): void {
    this.loading = true;
    this.hospedajeService.obtenerPorId(id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data) {
          this.hospedajeEncontrado = { ...res.data, displayLabel: `Hab ${res.data.habitacionNumero} - ${res.data.clienteNombre} (#${res.data.id})` };
          this.fechaActual = new Date();
          this.verificarExtension();
          this.loadConsumos(id);
        }
      },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar hospedaje' }); }
    });
  }

  formatFecha(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    const dia = this.dias[dt.getDay()];
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${dia} - ${mm}.${yyyy} - ${hh}:${min}`;
  }

  formatFechaExtendida(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mes = this.meses[d.getMonth()];
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd} ${mes} ${yyyy} - ${hh}:${min}`;
  }

  formatFechaCorta(d: Date): string {
    const dd = d.getDate();
    const mes = this.meses[d.getMonth()];
    const yyyy = d.getFullYear();
    return `${dd} ${mes} ${yyyy}`;
  }

  formatFechaDesdeStr(d: string): string {
    if (!d) return '';
    return this.formatFechaExtendida(new Date(d));
  }

  formatHora(d: Date): string {
    let hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 || 12;
    return `${hh}:${mm} ${ampm}`;
  }

  get totalDeuda(): number {
    if (!this.hospedajeEncontrado) return 0;
    const base = this.hospedajeEncontrado.deudaPendiente || 0;
    return base + this.cargoExtension;
  }

  get saldoRestante(): number {
    return Math.max(0, this.totalDeuda - this.montoPago);
  }

  get pagoCompleto(): boolean {
    return this.saldoRestante === 0;
  }

  buscarHospedaje(event: any): void {
    const valor = event.query?.trim() || '';
    if (!valor) { this.searchResults = []; return; }
    this.hospedajeService.search(valor).subscribe({
      next: (res) => {
        this.searchResults = (res.data || []).map((h: any) => ({
          ...h,
          displayLabel: `Hab ${h.habitacionNumero} - ${h.clienteNombre} (#${h.id})`
        }));
      },
      error: () => this.searchResults = []
    });
  }

  onSearchFocus(): void {
    if (this.searchResults.length > 0) {
      this.buscarHospedaje({ query: '' });
    }
  }

  onSelect(event: any): void {
    this.hospedajeEncontrado = event?.value;
    if (!this.hospedajeEncontrado) return;
    this.fechaActual = new Date();
    this.verificarExtension();
    this.loadConsumos(this.hospedajeEncontrado.id);
  }

  private verificarExtension(): void {
    if (!this.hospedajeEncontrado) return;
    const salidaProg = new Date(this.hospedajeEncontrado.fechaSalidaProgramada);
    const ahora = this.fechaActual;
    const mediodia = new Date(salidaProg);
    mediodia.setHours(12, 0, 0, 0);
    if (ahora > mediodia) {
      this.esExtension = true;
      const precioNoche = this.hospedajeEncontrado.habitacionPrecio || 0;
      const inicioExtra = new Date(mediodia);
      inicioExtra.setHours(0, 0, 0, 0);
      const finExtra = new Date(ahora);
      finExtra.setHours(0, 0, 0, 0);
      let dias = Math.round((finExtra.getTime() - inicioExtra.getTime()) / (1000 * 60 * 60 * 24));
      if (ahora.getHours() > 12) dias++;
      this.nochesExtra = Math.max(dias, 1);
      this.cargoExtension = precioNoche * this.nochesExtra;
    } else {
      this.esExtension = false;
      this.nochesExtra = 0;
      this.cargoExtension = 0;
    }
  }

  finalizarCheckOut(): void {
    if (!this.hospedajeEncontrado || this.loading) return;
    if (this.montoPago < 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El monto de pago no puede ser negativo' });
      return;
    }
    if (this.montoPago > this.totalDeuda) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El monto de pago no puede exceder la deuda total' });
      return;
    }
    const data: any = {
      fechaSalidaReal: new Date().toISOString()
    };
    let montoPagoFinal = this.montoPago;
    if (this.esExtension && this.cargoExtension > 0) {
      const montoExt = Math.min(this.cargoExtension, montoPagoFinal);
      data.montoExtension = montoExt;
      data.metodoExtension = this.metodoPago;
      montoPagoFinal = Math.max(0, montoPagoFinal - montoExt);
    }
    if (montoPagoFinal > 0) {
      data.montoPago = montoPagoFinal;
      data.metodoPago = this.metodoPago;
    }
    this.loading = true;
    this.hospedajeService.checkOut(this.hospedajeEncontrado.id, data).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Check-out realizado correctamente' });
        this.estadoActualizacion.habitacionCambio();
        this.estadoActualizacion.hospedajeCambio();
        this.estadoActualizacion.incidenciaCambio();
        this.estadoActualizacion.pagoCambio();
        this.estadoActualizacion.cajaCambio();
        this.estadoActualizacion.notificacionCambio();
        setTimeout(() => this.cerrar(), 1500);
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error en check-out' }); }
    });
  }

  imprimirFactura(): void {
    if (!this.hospedajeEncontrado) return;
    const h = this.hospedajeEncontrado;
    const cargas: any[] = [
      this.pagoService.listarPorHospedaje(h.id),
      this.consumoService.listarPorHospedaje(h.id),
    ];
    if (h.clienteId) cargas.push(this.clienteService.obtenerPorId(h.clienteId));

    forkJoin(cargas).subscribe({
      next: (res: any[]) => {
        const pagos = res[0]?.data || [];
        const consumos = res[1]?.data || [];
        const cliente = h.clienteId ? (res[2]?.data || null) : null;
        this.ensamblarFactura(h, pagos, consumos, cliente);
      },
      error: () => this.ensamblarFactura(h, [], [], null)
    });
  }

  private ensamblarFactura(h: any, pagos: any[], consumos: any[], cliente: any): void {
    cliente = cliente || {};
    const noct = h.fechaIngreso ? Math.max(1, Math.round((new Date(h.fechaSalidaProgramada || h.fechaIngreso).getTime() - new Date(h.fechaIngreso).getTime()) / 86400000)) : 0;
    const precioNoche = Number(h.habitacionPrecio || 0);
    const subtotalConsumos = (consumos || []).reduce((s, c) => s + (c.subtotal || 0), 0);
    const subtotalExtension = this.cargoExtension;
    const totalGeneral = Number(h.totalPagado || 0) + Number(h.deudaPendiente || 0);

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
      ],
      hospedaje: [
        { label: 'Habitación', value: h.habitacionNumero },
        { label: 'Tipo', value: h.habitacionTipo },
        { label: 'Piso', value: h.habitacionPiso },
        { label: 'Check-In', value: fmtFecha(h.fechaIngreso) },
        { label: 'Check-Out prog.', value: fmtFecha(h.fechaSalidaProgramada) },
        { label: 'Noches', value: noct },
        { label: 'Estado', value: h.estado },
      ],
      habitacion: [
        { label: 'Número', value: h.habitacionNumero },
        { label: 'Tipo', value: h.habitacionTipo },
        { label: 'Precio por noche', value: moneda(precioNoche) },
      ],
      detalle: [
        { concepto: 'Alojamiento (' + noct + ' noche(s))', cantidad: noct, precioUnitario: precioNoche, subtotal: precioNoche * noct },
        ...(this.esExtension && this.cargoExtension > 0 ? [{ concepto: 'Extensión', cantidad: 1, precioUnitario: this.cargoExtension, subtotal: this.cargoExtension }] : []),
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
        { label: 'Subtotal hospedaje', value: moneda(precioNoche * noct) },
        { label: 'Subtotal consumos', value: moneda(subtotalConsumos) },
        { label: 'Subtotal extensiones', value: moneda(subtotalExtension) },
        { label: 'Descuentos', value: moneda(0) },
        { label: 'Impuestos', value: moneda(0) },
        { label: 'TOTAL GENERAL', value: moneda(totalGeneral) },
        { label: 'Total pagado', value: moneda(h.totalPagado || 0) },
        { label: 'Saldo pendiente', value: moneda(h.deudaPendiente || 0) },
        { label: 'Cambio', value: moneda(0) },
      ],
      observaciones: h.observacion,
      pie: 'Gracias por hospedarse con nosotros.',
      autoImpresion: true,
    });
  }

  reportarSucio(): void {
    if (!this.hospedajeEncontrado) return;
    const data = {
      habitacionId: this.hospedajeEncontrado.habitacionId,
      tipo: 'LIMPIEZA_CHECKOUT',
      motivo: `Limpieza posterior al check-out - Hab. ${this.hospedajeEncontrado.habitacionNumero}`
    };
    this.incidenciaService.crear(data).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Incidencia de limpieza registrada' });
        this.estadoActualizacion.incidenciaCambio();
        this.estadoActualizacion.habitacionCambio();
        this.estadoActualizacion.notificacionCambio();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar limpieza' })
    });
  }

  liberarHabitacion(): void {
    if (!this.hospedajeEncontrado) return;
    const habId = this.hospedajeEncontrado.habitacionId;
    this.incidenciaService.listarActivas().subscribe({
      next: res => {
        const activas = (res.data || []) as any[];
        const inc = activas.find((i: any) => i.habitacionId === habId && i.tipo === 'LIMPIEZA_CHECKOUT');
        if (!inc) {
          this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay incidencia de limpieza pendiente para esta habitación' });
          return;
        }
        this.incidenciaService.finalizar(inc.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Habitación liberada correctamente' });
            this.estadoActualizacion.incidenciaCambio();
            this.estadoActualizacion.habitacionCambio();
            this.estadoActualizacion.notificacionCambio();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al liberar habitación' })
        });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar incidencias' })
    });
  }

  loadConsumos(hospedajeId: number): void {
    this.loadingConsumos = true;
    this.consumoService.listarPorHospedaje(hospedajeId).subscribe({
      next: res => { this.consumos = res.data || []; this.loadingConsumos = false; },
      error: () => this.loadingConsumos = false
    });
  }

  abrirModalConsumo(): void {
    this.showConsumoModal = true;
  }

  onConsumoSaved(): void {
    if (this.hospedajeEncontrado) {
      this.loadConsumos(this.hospedajeEncontrado.id);
      this.hospedajeService.obtenerPorId(this.hospedajeEncontrado.id).subscribe({
        next: res => { if (res.data) this.hospedajeEncontrado = { ...res.data, displayLabel: `Hab ${res.data.habitacionNumero} - ${res.data.clienteNombre} (#${res.data.id})` }; }
      });
    }
  }

  irAIncidencias(): void {
    this.cerrar();
    this.router.navigate(['/recepcion/incidencias']);
  }

  cerrar(): void {
    if (this.loading) return;
    this.hospedajeEncontrado = null;
    this.searchResults = [];
    this.esExtension = false;
    this.nochesExtra = 0;
    this.cargoExtension = 0;
    this.montoPago = 0;
    this.consumos = [];
    this.layoutState.setOverlay(false);
    this.close.emit();
  }
}
