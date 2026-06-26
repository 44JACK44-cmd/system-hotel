import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IncidenciaService } from '../../../observable/incidencia.service';
import { HabitacionService } from '../../../observable/habitacion.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './incidencias.component.html',
  styleUrls: ['./incidencias.component.css']
})
export class IncidenciasComponent implements OnInit {
  private incidenciaService = inject(IncidenciaService);
  private habService = inject(HabitacionService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  incidencias: any[] = [];
  habitaciones: any[] = [];
  loading = false;

  get incidenciasActivas(): any[] {
    return this.incidencias.filter(i => i.estado === 'ACTIVA');
  }

  tipos = [
    { label: 'Limpieza', value: 'LIMPIEZA' },
    { label: 'Mantenimiento', value: 'MANTENIMIENTO' }
  ];

  incidenciaForm = this.fb.group({
    habitacionId: [null, Validators.required],
    tipo: ['LIMPIEZA', Validators.required],
    motivo: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadIncidencias();
    this.loadHabitaciones();
  }

  loadIncidencias(): void {
    this.loading = true;
    this.incidenciaService.listarActivas().subscribe({
      next: res => { this.incidencias = res.data || []; this.loading = false; },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar incidencias' }); }
    });
  }

  loadHabitaciones(): void {
    this.habService.listarActivas().subscribe({
      next: res => {
        this.habitaciones = (res.data || [])
          .map((h: any) => ({ ...h, label: `${h.numero} - ${h.tipo} (${h.estado})` }));
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar habitaciones' })
    });
  }

  save(): void {
    if (this.incidenciaForm.invalid) return;
    const habId = this.incidenciaForm.value.habitacionId;
    const hab = this.habitaciones.find(h => h.id === habId);
    const tipo = this.incidenciaForm.value.tipo;
    if (hab && hab.estado === 'OCUPADA' && tipo === 'LIMPIEZA') {
      this.messageService.add({ severity: 'warn', summary: 'RN-11', detail: 'No se puede crear incidencia de limpieza en habitación OCUPADA' });
      return;
    }
    this.loading = true;
    this.incidenciaService.crear(this.incidenciaForm.value).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Incidencia registrada' });
        this.incidenciaForm.reset({ tipo: 'LIMPIEZA' });
        this.loading = false;
        this.loadIncidencias();
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
    });
  }

  finalizar(incidencia: any): void {
    this.loading = true;
    this.incidenciaService.finalizar(incidencia.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Incidencia finalizada' });
        this.loading = false;
        this.loadIncidencias();
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
    });
  }
}
