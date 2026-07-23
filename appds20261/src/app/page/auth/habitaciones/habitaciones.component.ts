import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HabitacionService } from '../../../observable/habitacion.service';
import { AuthService } from '../../../observable/auth.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LayoutStateService } from '../../../services/layout-state.service';

@Component({
  selector: 'app-habitaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, InputNumberModule, SelectModule, CardModule, ToastModule, TabsModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './habitaciones.component.html',
  styleUrls: ['./habitaciones.component.css']
})
export class HabitacionesComponent implements OnInit, OnDestroy {
  private habService = inject(HabitacionService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private authService = inject(AuthService);
  private layoutState = inject(LayoutStateService);
  habitaciones: any[] = [];
  loading = false;

  get isAdmin(): boolean { return this.authService.isAdmin(); }
  mapa: any = {};
  pisos: number[] = [];
  dialogVisible = false;
  editing = false;
  editingId: number | null = null;
  activeTab = 'mapa';
  estadoDialogVisible = false;
  selectedHabitacion: any = null;

  filterPiso = '';
  filterEstado = '';
  filterSearch = '';

  pisosOpt = [1, 2, 3, 4, 5].map(p => ({ label: `Piso ${p}`, value: p }));
  tipos = [
    { label: 'Simple', value: 'SIMPLE' },
    { label: 'Matrimonial', value: 'MATRIMONIAL' },
    { label: 'Doble Cama', value: 'DOBLE_CAMA' }
  ];

  habForm = this.fb.group({
    piso: [1, Validators.required],
    numero: ['', Validators.required],
    tipo: ['SIMPLE', Validators.required],
    precioNoche: [0, [Validators.required, Validators.min(0.01)]]
  });

  get filterPisos(): any[] {
    return [{ label: 'Todos los pisos', value: '' }, ...this.pisos.map(p => ({ label: `Piso ${p}`, value: p }))];
  }
  get filterEstados(): any[] {
    return [
      { label: 'Todos los estados', value: '' },
      { label: 'Disponible', value: 'DISPONIBLE' },
      { label: 'Ocupada', value: 'OCUPADA' },
      { label: 'Sucia', value: 'LIMPIEZA' },
      { label: 'Mantenimiento', value: 'MANTENIMIENTO' }
    ];
  }
  get filteredHabitaciones(): any[] {
    let result = [...this.habitaciones];
    if (this.filterPiso) {
      result = result.filter(h => h.piso === Number(this.filterPiso));
    }
    if (this.filterEstado) {
      result = result.filter(h => h.estado === this.filterEstado);
    }
    if (this.filterSearch) {
      const q = this.filterSearch.toLowerCase();
      result = result.filter(h =>
        h.numero?.toLowerCase().includes(q) ||
        h.tipo?.toLowerCase().includes(q)
      );
    }
    return result;
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      DISPONIBLE: 'badge-available',
      OCUPADA: 'badge-occupied',
      LIMPIEZA: 'badge-dirty',
      MANTENIMIENTO: 'badge-maintenance'
    };
    return map[estado] || 'badge-info';
  }

  applyFilter(): void {
    // trigger change detection via getter
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.layoutState.setOverlay(false);
  }

  loadData(): void {
    this.loading = true;
    this.habService.listarActivas().subscribe({ next: res => {
      this.habitaciones = res.data || [];
      this.mapa = {};
      this.habitaciones.forEach(h => {
        if (!this.mapa[h.piso]) this.mapa[h.piso] = [];
        this.mapa[h.piso].push(h);
      });
      this.pisos = Object.keys(this.mapa).map(Number).sort();
      this.loading = false;
      this.cdr.detectChanges();
      this.appRef.tick();
    }, error: () => this.loading = false });
  }

  getByPiso(piso: number): any[] { return this.mapa[piso] || []; }

  getColor(estado: string): string {
    const colors: any = { DISPONIBLE: '#22c55e', OCUPADA: '#ef4444', LIMPIEZA: '#eab308', MANTENIMIENTO: '#6b7280' };
    return colors[estado] || '#6b7280';
  }

  showDialog(): void {
    this.editing = false;
    this.editingId = null;
    this.habForm.reset({ piso: 1, tipo: 'SIMPLE', precioNoche: 0 });
    this.dialogVisible = true;
    this.layoutState.setOverlay(true);
  }

  editHabitacion(h: any): void {
    this.editing = true;
    this.editingId = h.id;
    this.habForm.patchValue(h);
    this.dialogVisible = true;
    this.layoutState.setOverlay(true);
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.layoutState.setOverlay(false);
  }

  save(): void {
    if (this.habForm.invalid) return;
    this.loading = true;
    if (this.editing && this.editingId) {
      this.habService.actualizar(this.editingId, this.habForm.value).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Habitacion actualizada' }); this.dialogVisible = false; this.layoutState.setOverlay(false); this.loading = false; this.loadData(); },
        error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
      });
    } else {
      this.habService.crear(this.habForm.value).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Habitacion creada' }); this.dialogVisible = false; this.layoutState.setOverlay(false); this.loading = false; this.loadData(); },
        error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
      });
    }
  }

  deleteHabitacion(h: any): void {
    this.confirmationService.confirm({
      message: `Desactivar habitacion ${h.numero}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.habService.eliminar(h.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Habitacion desactivada' }); this.loading = false; this.loadData(); },
          error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
        });
      }
    });
  }

  showEstadoDialog(h: any): void {
    this.selectedHabitacion = h;
    this.estadoDialogVisible = true;
    this.layoutState.setOverlay(true);
  }

  closeEstadoDialog(): void {
    this.estadoDialogVisible = false;
    this.layoutState.setOverlay(false);
  }

  cambiarEstado(estado: string): void {
    if (!this.selectedHabitacion) return;
    this.loading = true;
    this.habService.cambiarEstado(this.selectedHabitacion.id, estado).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Estado cambiado' }); this.estadoDialogVisible = false; this.layoutState.setOverlay(false); this.loading = false; this.loadData(); },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
    });
  }
}
