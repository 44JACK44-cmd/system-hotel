import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../observable/reserva.service';
import { HospedajeService } from '../../observable/hospedaje.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, InputNumberModule, RadioButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './checkin.component.html',
  styleUrl: './checkin.component.css'
})
export class CheckInComponent {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  private reservaService = inject(ReservaService);
  private hospedajeService = inject(HospedajeService);
  private messageService = inject(MessageService);

  private dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  searchTerm = '';
  reservaEncontrada: any = null;
  montoSaldo = 0;
  metodoPago = 'YAPE';
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

  formatMonto(v: number): string {
    return v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  buscarReserva(): void {
    if (!this.searchTerm.trim()) return;
    const id = parseInt(this.searchTerm, 10);
    if (isNaN(id)) {
      this.messageService.add({ severity: 'warn', summary: 'Búsqueda', detail: 'Ingrese un ID de reserva válido' });
      return;
    }
    this.loading = true;
    this.reservaService.obtenerPorId(id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data) {
          if (res.data.estado !== 'CONFIRMADA') {
            this.messageService.add({ severity: 'warn', summary: 'Estado inválido', detail: 'Solo reservas CONFIRMADA pueden hacer check-in' });
            return;
          }
          const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
          const fechaEnt = new Date(res.data.fechaEntrada); fechaEnt.setHours(0, 0, 0, 0);
          if (fechaEnt.getTime() > hoy.getTime()) {
            this.messageService.add({ severity: 'warn', summary: 'Fecha inválida', detail: 'La fecha de entrada debe ser hoy o anterior' });
            return;
          }
          this.reservaEncontrada = res.data;
          this.montoSaldo = (res.data.montoTotal || 0) - (res.data.montoAdelanto || 0);
        } else {
          this.messageService.add({ severity: 'warn', summary: 'No encontrada', detail: 'Reserva no encontrada' });
        }
      },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar reserva' }); }
    });
  }

  iniciarCheckIn(): void {
    if (!this.reservaEncontrada) return;
    if (this.reservaEncontrada.estado !== 'CONFIRMADA') {
      this.messageService.add({ severity: 'warn', summary: 'Estado inválido', detail: 'Solo reservas CONFIRMADA' });
      return;
    }
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fechaEnt = new Date(this.reservaEncontrada.fechaEntrada); fechaEnt.setHours(0, 0, 0, 0);
    if (fechaEnt.getTime() > hoy.getTime()) {
      this.messageService.add({ severity: 'warn', summary: 'Fecha inválida', detail: 'La fecha de entrada debe ser hoy o anterior' });
      return;
    }
    if (this.montoSaldo > 0) {
      const saldoReal = (this.reservaEncontrada.montoTotal || 0) - (this.reservaEncontrada.montoAdelanto || 0);
      if (this.montoSaldo !== saldoReal) {
        this.messageService.add({ severity: 'warn', summary: 'Monto inválido', detail: 'El monto debe ser S/ ' + saldoReal.toFixed(2) });
        return;
      }
    }
    this.loading = true;
    this.hospedajeService.checkIn({
      reservaId: this.reservaEncontrada.id,
      montoSaldo: this.montoSaldo,
      metodoSaldo: this.metodoPago
    }).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Check-in realizado correctamente' });
        setTimeout(() => this.cerrar(), 1000);
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error en check-in' }); }
    });
  }

  cerrar(): void {
    this.reservaEncontrada = null;
    this.searchTerm = '';
    this.close.emit();
  }
}
