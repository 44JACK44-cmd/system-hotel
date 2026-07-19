import { Component, inject, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HospedajeService } from '../../observable/hospedaje.service';
import { IncidenciaService } from '../../observable/incidencia.service';
import { ConsumoService, ConsumoResponse } from '../../observable/consumo.service';
import { ConsumoModalComponent } from '../consumo-modal/consumo-modal.component';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, InputNumberModule, RadioButtonModule, TooltipModule, ToastModule, ConsumoModalComponent],
  providers: [MessageService],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckOutComponent implements OnChanges {
  @Input() visible = false;
  @Input() hospedajeId: number | null = null;
  @Output() close = new EventEmitter<void>();

  private router = inject(Router);
  private hospedajeService = inject(HospedajeService);
  private incidenciaService = inject(IncidenciaService);
  private consumoService = inject(ConsumoService);
  private messageService = inject(MessageService);

  Math = Math;
  private dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  private meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  searchTerm = '';
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

  ngOnChanges(changes: any): void {
    if (changes['hospedajeId'] && this.hospedajeId && this.visible) {
      this.buscarHospedajePorId(this.hospedajeId);
    }
  }

  private diagnosticarAlturas(): void {
    setTimeout(() => {
      const panel = document.querySelector('.hs-slide-panel') as HTMLElement;
      const body = document.querySelector('.hs-slide-panel__body') as HTMLElement;
      const overlay = document.querySelector('.hs-overlay') as HTMLElement;
      const header = document.querySelector('.hs-slide-panel__header') as HTMLElement;
      const transactionCard = document.querySelector('.co-transaction-card') as HTMLElement;
      const transactionFooter = document.querySelector('.co-transaction-footer') as HTMLElement;
      if (!panel || !body) return;
      const info: string[] = [
        '=== CHECKOUT PANEL HEIGHT CHAIN ===',
        `OVERLAY        | display:${getComputedStyle(overlay).display} | height:${overlay?.offsetHeight} | scrollH:${overlay?.scrollHeight} | clientH:${overlay?.clientHeight} | overflow:${getComputedStyle(overlay).overflow} | overflow-y:${getComputedStyle(overlay).overflowY}`,
        `SLIDE-PANEL    | display:${getComputedStyle(panel).display} | flex:${getComputedStyle(panel).flex} | height:${panel.offsetHeight} | scrollH:${panel.scrollHeight} | clientH:${panel.clientHeight} | overflow:${getComputedStyle(panel).overflow} | overflow-y:${getComputedStyle(panel).overflowY} | min-h:${getComputedStyle(panel).minHeight} | max-h:${getComputedStyle(panel).maxHeight}`,
        `HEADER         | display:${getComputedStyle(header).display} | height:${header?.offsetHeight} | flex-shrink:${getComputedStyle(header).flexShrink}`,
        `BODY           | display:${getComputedStyle(body).display} | flex:${getComputedStyle(body).flex} | height:${body.offsetHeight} | scrollH:${body.scrollHeight} | clientH:${body.clientHeight} | overflow:${getComputedStyle(body).overflow} | overflow-y:${getComputedStyle(body).overflowY} | min-h:${getComputedStyle(body).minHeight}`,
      ];
      if (transactionCard) {
        info.push(`TRANSACTION    | display:${getComputedStyle(transactionCard).display} | height:${transactionCard.offsetHeight} | scrollH:${transactionCard.scrollHeight} | clientH:${transactionCard.clientHeight} | overflow:${getComputedStyle(transactionCard).overflow}`);
      }
      if (transactionFooter) {
        info.push(`FOOTER         | display:${getComputedStyle(transactionFooter).display} | height:${transactionFooter.offsetHeight} | scrollH:${transactionFooter.scrollHeight} | clientH:${transactionFooter.clientHeight}`);
      }
      info.push(`VIEWPORT       | innerHeight:${window.innerHeight} | 100vh:${window.innerHeight}px`);
      info.push(`CONTENT DELTA  | body.scrollH(${body.scrollHeight}) - body.clientH(${body.clientHeight}) = ${body.scrollHeight - body.clientHeight}px (${body.scrollHeight - body.clientHeight > 0 ? 'HAY OVERFLOW' : 'NO hay overflow'})`);
      info.push('====================================');
      console.log(info.join('\n'));
    }, 500);
  }

  private buscarHospedajePorId(id: number): void {
    this.loading = true;
    this.hospedajeService.obtenerPorId(id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data) {
          this.hospedajeEncontrado = res.data;
          this.fechaActual = new Date();
          this.verificarExtension();
          this.loadConsumos(id);
          setTimeout(() => this.diagnosticarAlturas(), 300);
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

  buscarHospedaje(): void {
    if (!this.searchTerm.trim()) return;
    const id = parseInt(this.searchTerm, 10);
    if (isNaN(id)) {
      this.messageService.add({ severity: 'warn', summary: 'Búsqueda', detail: 'Ingrese un ID de hospedaje válido' });
      return;
    }
    this.loading = true;
    this.hospedajeService.obtenerPorId(id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data) {
          this.hospedajeEncontrado = res.data;
          this.fechaActual = new Date();
          this.verificarExtension();
          setTimeout(() => this.diagnosticarAlturas(), 300);
        } else {
          this.messageService.add({ severity: 'warn', summary: 'No encontrado', detail: 'Hospedaje no encontrado' });
        }
      },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar hospedaje' }); }
    });
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
        setTimeout(() => this.cerrar(), 1500);
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error en check-out' }); }
    });
  }

  imprimirFactura(): void {
    if (!this.hospedajeEncontrado) return;
    const h = this.hospedajeEncontrado;
    const factura = `HOSPEDAJE #${h.id}
Huésped: ${h.clienteNombre}
Habitación: ${h.habitacionNumero} - ${h.habitacionTipo}
Ingreso: ${this.formatFecha(h.fechaIngreso)}
Salida: ${this.formatFechaDesdeStr(h.fechaSalidaProgramada)}
Total Pagado: S/ ${(h.totalPagado || 0).toFixed(2)}
Deuda: S/ ${(h.deudaPendiente || 0).toFixed(2)}
${this.esExtension ? `Cargo Extensión: S/ ${this.cargoExtension.toFixed(2)}` : ''}
TOTAL A PAGAR: S/ ${this.totalDeuda.toFixed(2)}`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<html><head><title>Factura #${h.id}</title><style>body{font-family:monospace;padding:40px;max-width:400px;margin:auto}hr{border:none;border-top:1px dashed #000}h2{text-align:center}.total{font-size:1.3em;font-weight:bold;text-align:right}</style></head><body>`);
      win.document.write(`<h2>FACTURA</h2><p>Hospedaje #${h.id}</p><hr>`);
      win.document.write(`<p><strong>Huésped:</strong> ${h.clienteNombre}</p>`);
      win.document.write(`<p><strong>Habitación:</strong> ${h.habitacionNumero} - ${h.habitacionTipo}</p>`);
      win.document.write(`<p><strong>Ingreso:</strong> ${this.formatFecha(h.fechaIngreso)}</p>`);
      win.document.write(`<p><strong>Salida Prog.:</strong> ${this.formatFechaDesdeStr(h.fechaSalidaProgramada)}</p><hr>`);
      win.document.write(`<p><strong>Total Hospedaje:</strong> S/ ${((h.totalPagado || 0)+(h.deudaPendiente || 0)).toFixed(2)}</p>`);
      win.document.write(`<p><strong>Pagado:</strong> -S/ ${(h.totalPagado || 0).toFixed(2)}</p>`);
      if (this.esExtension && this.cargoExtension > 0) {
        win.document.write(`<p><strong>Extensión:</strong> +S/ ${this.cargoExtension.toFixed(2)}</p>`);
      }
      win.document.write(`<hr><p class="total">TOTAL: S/ ${this.totalDeuda.toFixed(2)}</p>`);
      win.document.write(`<p style="text-align:center;margin-top:40px;color:#666">Gracias por su preferencia</p>`);
      win.document.write('</body></html>');
      win.document.close();
      win.print();
    }
  }

  reportarSucio(): void {
    if (!this.hospedajeEncontrado) return;
    const data = {
      hospedajeId: this.hospedajeEncontrado.id,
      tipo: 'LIMPIEZA',
      motivo: `Limpieza requerida - Hab. ${this.hospedajeEncontrado.habitacionNumero}`,
      descripcion: `Check-out completado. Solicitar limpieza para habitación ${this.hospedajeEncontrado.habitacionNumero}`
    };
    this.incidenciaService.crear(data).subscribe({
      next: () => this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Incidencia de limpieza registrada' }),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar limpieza' })
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
        next: res => { if (res.data) this.hospedajeEncontrado = res.data; }
      });
    }
  }

  irAIncidencias(): void {
    this.cerrar();
    this.router.navigate(['/incidencias']);
  }

  irAConfiguracion(): void {
    this.cerrar();
    this.router.navigate(['/configuracion']);
  }

  cerrar(): void {
    if (this.loading) return;
    this.hospedajeEncontrado = null;
    this.searchTerm = '';
    this.esExtension = false;
    this.nochesExtra = 0;
    this.cargoExtension = 0;
    this.montoPago = 0;
    this.consumos = [];
    this.close.emit();
  }
}
