import { Component, inject, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidenciaService } from '../../observable/incidencia.service';
import { HabitacionService } from '../../observable/habitacion.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LayoutStateService } from '../../services/layout-state.service';

@Component({
  selector: 'app-incidencia-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, TextareaModule, SelectModule, ToastModule],
  providers: [MessageService],
  templateUrl: './incidencia-modal.component.html',
  styleUrl: './incidencia-modal.component.css'
})
export class IncidenciaModalComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  private incidenciaService = inject(IncidenciaService);
  private habService = inject(HabitacionService);
  private messageService = inject(MessageService);
  private layoutState = inject(LayoutStateService);

  habitaciones: any[] = [];

  tipos = [
    { label: 'Limpieza', value: 'LIMPIEZA' },
    { label: 'Mantenimiento', value: 'MANTENIMIENTO' }
  ];

  habitacionId: number | null = null;
  tipo = 'LIMPIEZA';
  motivo = '';
  loading = false;

  ngOnInit(): void {
    this.layoutState.setOverlay(true);
    this.cargarHabitaciones();
  }

  ngOnDestroy(): void {
    this.layoutState.setOverlay(false);
  }

  cargarHabitaciones(): void {
    this.habService.listarActivas().subscribe(res => {
      this.habitaciones = (res.data || [])
        .map((h: any) => ({ ...h, label: `${h.numero} - ${h.tipo} (${h.estado})` }));
    });
  }

  puedeGuardar(): boolean {
    return !!this.habitacionId && !!this.motivo.trim();
  }

  guardar(): void {
    if (!this.habitacionId) return;
    const hab = this.habitaciones.find(h => h.id === this.habitacionId);
    if (hab && hab.estado === 'OCUPADA' && this.tipo === 'LIMPIEZA') {
      this.messageService.add({ severity: 'warn', summary: 'RN-11', detail: 'No se puede crear incidencia de limpieza en habitación OCUPADA' });
      return;
    }
    this.loading = true;
    this.incidenciaService.crear({
      habitacionId: this.habitacionId,
      tipo: this.tipo,
      motivo: this.motivo
    }).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Incidencia registrada' });
        setTimeout(() => this.cerrar(), 1000);
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al registrar incidencia' }); }
    });
  }

  cerrar(): void {
    this.habitacionId = null;
    this.motivo = '';
    this.layoutState.setOverlay(false);
    this.close.emit();
  }
}
