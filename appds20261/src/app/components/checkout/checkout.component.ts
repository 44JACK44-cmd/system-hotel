import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
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
export class CheckOutComponent {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  private hospedajeService = inject(HospedajeService);
  private messageService = inject(MessageService);

  private dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  private meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  searchTerm = '';
  hospedajeEncontrado: any = null;
  montoExtension = 0;
  metodoPago = 'YAPE';
  fechaActual = new Date();
  esExtension = false;
  precioExtension = 0;
  horasExtension = 0;
  loading = false;

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
      this.precioExtension = this.hospedajeEncontrado.habitacionPrecio || 100;
      this.horasExtension = Math.floor((ahora.getTime() - mediodia.getTime()) / (1000 * 60 * 60));
      if (this.horasExtension < 1) this.horasExtension = 1;
      this.montoExtension = this.precioExtension;
    } else {
      this.esExtension = false;
      this.horasExtension = 0;
      this.montoExtension = 0;
    }
  }

  finalizarCheckOut(): void {
    if (!this.hospedajeEncontrado) return;
    const data: any = {
      fechaSalidaReal: new Date().toISOString(),
      montoExtension: this.montoExtension,
      metodoExtension: this.metodoPago
    };
    this.loading = true;
    this.hospedajeService.checkOut(this.hospedajeEncontrado.id, data).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Check-out realizado correctamente' });
        setTimeout(() => this.cerrar(), 1000);
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error en check-out' }); }
    });
  }

  cerrar(): void {
    this.hospedajeEncontrado = null;
    this.searchTerm = '';
    this.esExtension = false;
    this.close.emit();
  }
}
