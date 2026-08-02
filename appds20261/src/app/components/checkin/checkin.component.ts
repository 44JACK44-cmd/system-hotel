import { Component, inject, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../observable/reserva.service';
import { HospedajeService } from '../../observable/hospedaje.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LayoutStateService } from '../../services/layout-state.service';
import { EstadoActualizacionService } from '../../services/estado-actualizacion.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, InputNumberModule, RadioButtonModule, AutoCompleteModule, ToastModule],
  providers: [MessageService],
  templateUrl: './checkin.component.html',
  styleUrl: './checkin.component.css'
})
export class CheckInComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  private reservaService = inject(ReservaService);
  private hospedajeService = inject(HospedajeService);
  private messageService = inject(MessageService);
  private layoutState = inject(LayoutStateService);
  private estadoActualizacion = inject(EstadoActualizacionService);

  private destroy$ = new Subject<void>();

  searchTerm = '';
  searchResults: any[] = [];
  selectedReserva: any = null;
  montoSaldo = 0;
  metodoPago = 'YAPE';
  loading = false;
  initialLoading = true;

  ngOnInit(): void {
    this.layoutState.setOverlay(true);
    this.cargarReservasDelDia();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.layoutState.setOverlay(false);
  }

  cargarReservasDelDia(): void {
    this.initialLoading = true;
    this.reservaService.listarDelDia().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const reservas = (res.data || []).filter((r: any) => r.estado === 'CONFIRMADA');
        this.searchResults = reservas.map((r: any) => ({
          ...r,
          displayLabel: `${r.clienteNombre} - Reserva #${r.id} - Hab ${r.habitacionNumero}`
        }));
        this.initialLoading = false;
      },
      error: () => {
        this.initialLoading = false;
      }
    });
  }

  buscarReserva(event: any): void {
    const valor = event.query?.trim() || this.searchTerm?.trim();
    if (!valor) {
      this.searchResults = [];
      return;
    }
    this.reservaService.search(valor).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.searchResults = (res.data || []).map((r: any) => ({
          ...r,
          displayLabel: `${r.clienteNombre} - Reserva #${r.id} - Hab ${r.habitacionNumero}`
        }));
      },
      error: () => this.searchResults = []
    });
  }

  onSearchFocus(): void {
    if (this.searchResults.length > 0 && (!this.searchTerm || this.searchTerm.trim().length < 2)) {
      this.buscarReserva({ query: this.searchTerm || '' });
    }
  }

  onSelect(event: any): void {
    this.selectedReserva = event?.value;
    if (!this.selectedReserva) return;
    if (this.selectedReserva.estado !== 'CONFIRMADA') {
      this.messageService.add({ severity: 'warn', summary: 'Estado inválido', detail: 'Solo reservas CONFIRMADA pueden hacer check-in' });
      this.selectedReserva = null;
      return;
    }
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fechaEnt = new Date(this.selectedReserva.fechaEntrada); fechaEnt.setHours(0, 0, 0, 0);
    if (fechaEnt.getTime() > hoy.getTime()) {
      this.messageService.add({ severity: 'warn', summary: 'Fecha inválida', detail: 'La fecha de entrada debe ser hoy o anterior' });
      this.selectedReserva = null;
      return;
    }
    this.montoSaldo = (this.selectedReserva.montoTotal || 0) - (this.selectedReserva.montoAdelanto || 0);
  }

  iniciarCheckIn(): void {
    if (!this.selectedReserva) return;
    if (this.selectedReserva.estado !== 'CONFIRMADA') {
      this.messageService.add({ severity: 'warn', summary: 'Estado inválido', detail: 'Solo reservas CONFIRMADA' });
      return;
    }
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fechaEnt = new Date(this.selectedReserva.fechaEntrada); fechaEnt.setHours(0, 0, 0, 0);
    if (fechaEnt.getTime() > hoy.getTime()) {
      this.messageService.add({ severity: 'warn', summary: 'Fecha inválida', detail: 'La fecha de entrada debe ser hoy o anterior' });
      return;
    }
    if (this.montoSaldo > 0) {
      const saldoReal = (this.selectedReserva.montoTotal || 0) - (this.selectedReserva.montoAdelanto || 0);
      if (this.montoSaldo > saldoReal) {
        this.messageService.add({ severity: 'warn', summary: 'Monto inválido', detail: 'El monto no puede exceder el saldo pendiente (S/ ' + saldoReal.toFixed(2) + ')' });
        return;
      }
    }
    this.loading = true;
    this.hospedajeService.checkIn({
      reservaId: this.selectedReserva.id,
      montoSaldo: this.montoSaldo || 0,
      metodoSaldo: this.metodoPago
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Check-in realizado correctamente' });
        this.estadoActualizacion.habitacionCambio();
        this.estadoActualizacion.hospedajeCambio();
        this.estadoActualizacion.reservaCambio();
        this.estadoActualizacion.pagoCambio();
        this.estadoActualizacion.cajaCambio();
        setTimeout(() => this.cerrar(), 1000);
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error en check-in' }); }
    });
  }

  formatFecha(d: string): string {
    if (!d) return '';
    const f = new Date(d);
    return f.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  formatMonto(v: any): string {
    const n = Number(v) || 0;
    return n.toFixed(2);
  }

  cerrar(): void {
    this.selectedReserva = null;
    this.searchTerm = '';
    this.searchResults = [];
    this.montoSaldo = 0;
    this.metodoPago = 'YAPE';
    this.layoutState.setOverlay(false);
    this.close.emit();
  }
}
