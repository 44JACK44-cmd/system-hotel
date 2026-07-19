import { Component, inject, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConsumoService, ConsumoResponse } from '../../observable/consumo.service';
import { LayoutStateService } from '../../services/layout-state.service';

@Component({
  selector: 'app-consumo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './consumo-modal.component.html',
  styleUrl: './consumo-modal.component.css'
})
export class ConsumoModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible = false;
  @Input() hospedajeId: number | null = null;
  @Input() editConsumo: ConsumoResponse | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private consumoService = inject(ConsumoService);
  private messageService = inject(MessageService);
  private layoutState = inject(LayoutStateService);

  saving = false;
  tipos = ['MINIBAR', 'LAVANDERIA', 'RESTAURANTE', 'ROOM_SERVICE', 'OTROS'];
  tipoSeleccionado = 'MINIBAR';
  descripcion = '';
  cantidad = 1;
  precioUnitario = 0;
  observacion = '';

  get subtotal(): number {
    return (this.cantidad || 0) * (this.precioUnitario || 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.layoutState.setOverlay(!!changes['visible'].currentValue);
    }
  }

  ngOnInit(): void {
    this.resetForm();
  }

  ngOnDestroy(): void {
    this.layoutState.setOverlay(false);
  }

  resetForm(): void {
    if (this.editConsumo) {
      this.tipoSeleccionado = this.editConsumo.tipoConsumo || 'MINIBAR';
      this.descripcion = this.editConsumo.descripcion || '';
      this.cantidad = this.editConsumo.cantidad || 1;
      this.precioUnitario = this.editConsumo.precioUnitario || 0;
      this.observacion = this.editConsumo.observacion || '';
    } else {
      this.tipoSeleccionado = 'MINIBAR';
      this.descripcion = '';
      this.cantidad = 1;
      this.precioUnitario = 0;
      this.observacion = '';
    }
  }

  guardar(): void {
    if (!this.hospedajeId) return;
    if (!this.descripcion.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese una descripción' });
      return;
    }
    if (this.cantidad < 1) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La cantidad debe ser mayor a 0' });
      return;
    }
    if (this.precioUnitario <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El precio debe ser mayor a 0' });
      return;
    }

    const data = {
      hospedajeId: this.hospedajeId,
      tipoConsumo: this.tipoSeleccionado,
      descripcion: this.descripcion.trim(),
      cantidad: this.cantidad,
      precioUnitario: this.precioUnitario,
      observacion: this.observacion.trim()
    };

    this.saving = true;
    const obs = this.editConsumo
      ? this.consumoService.actualizar(this.editConsumo.id, data)
      : this.consumoService.registrar(data);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editConsumo ? 'Consumo actualizado' : 'Consumo registrado' });
        this.saved.emit();
        this.cerrar();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al guardar consumo' });
      }
    });
  }

  cerrar(): void {
    if (this.saving) return;
    this.editConsumo = null;
    this.close.emit();
  }
}
