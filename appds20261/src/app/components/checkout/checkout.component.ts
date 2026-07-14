import { Component, inject, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospedajeService } from '../../observable/hospedaje.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, InputNumberModule, RadioButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckOutComponent implements OnChanges {
  @Input() visible = false;
  @Input() hospedajeId: number | null = null;
  @Output() close = new EventEmitter<void>();

  private hospedajeService = inject(HospedajeService);
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

  ngOnChanges(changes: any): void {
    if (changes['hospedajeId'] && this.hospedajeId && this.visible) {
      this.buscarHospedajePorId(this.hospedajeId);
    }
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

  cerrar(): void {
    if (this.loading) return;
    this.hospedajeEncontrado = null;
    this.searchTerm = '';
    this.esExtension = false;
    this.nochesExtra = 0;
    this.cargoExtension = 0;
    this.montoPago = 0;
    this.close.emit();
  }
}
