import { Component, inject, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../../observable/pago.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LayoutStateService } from '../../services/layout-state.service';

@Component({
  selector: 'app-pagos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, InputNumberModule, SelectModule, ToastModule],
  providers: [MessageService],
  templateUrl: './pagos-modal.component.html',
  styleUrl: './pagos-modal.component.css'
})
export class PagosModalComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  private pagoService = inject(PagoService);
  private messageService = inject(MessageService);
  private layoutState = inject(LayoutStateService);

  tipos = [
    { label: 'Adelanto', value: 'ADELANTO' },
    { label: 'Saldo', value: 'SALDO' },
    { label: 'Extensión', value: 'EXTENSION' }
  ];
  metodos = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Yape', value: 'YAPE' }
  ];

  tipo = 'SALDO';
  monto = 0;
  metodo = 'EFECTIVO';
  referencia = '';
  reservaId: number | null = null;
  hospedajeId: number | null = null;
  loading = false;

  puedeGuardar(): boolean {
    return this.monto > 0;
  }

  guardar(): void {
    this.loading = true;
    this.pagoService.registrar({
      tipo: this.tipo,
      monto: this.monto,
      metodo: this.metodo,
      referencia: this.referencia || undefined,
      reservaId: this.reservaId || undefined,
      hospedajeId: this.hospedajeId || undefined
    }).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pago registrado correctamente' });
        setTimeout(() => this.cerrar(), 1000);
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al registrar pago' }); }
    });
  }

  ngOnInit(): void {
    this.layoutState.setOverlay(true);
  }

  ngOnDestroy(): void {
    this.layoutState.setOverlay(false);
  }

  cerrar(): void {
    this.monto = 0;
    this.referencia = '';
    this.reservaId = null;
    this.hospedajeId = null;
    this.layoutState.setOverlay(false);
    this.close.emit();
  }
}
