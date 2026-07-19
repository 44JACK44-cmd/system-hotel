import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospedajeService } from '../../../observable/hospedaje.service';
import { ConsumoService, ConsumoResponse } from '../../../observable/consumo.service';
import { ClienteService } from '../../../observable/cliente.service';
import { HabitacionService } from '../../../observable/habitacion.service';
import { IncidenciaService } from '../../../observable/incidencia.service';
import { ReservaService } from '../../../observable/reserva.service';
import { CheckOutComponent } from '../../../components/checkout/checkout.component';
import { ConsumoModalComponent } from '../../../components/consumo-modal/consumo-modal.component';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-hospedajes',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, SelectModule, InputNumberModule, TooltipModule, ConfirmDialogModule, CheckOutComponent, ConsumoModalComponent],
  providers: [MessageService, ConfirmationService],
  templateUrl: './hospedajes.component.html',
  styleUrls: ['./hospedajes.component.css']
})
export class HospedajesComponent implements OnInit, OnDestroy {
  private hospedajeService = inject(HospedajeService);
  private consumoService = inject(ConsumoService);
  private clienteService = inject(ClienteService);
  private habService = inject(HabitacionService);
  private incidenciaService = inject(IncidenciaService);
  private reservaService = inject(ReservaService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  activeTab = 'activos';
  loading = false;
  hospedajes: any[] = [];
  clientes: any[] = [];
  habitacionesDisponibles: any[] = [];
  totalHabitaciones = 0;

  selectedHospedajeId: number | null = null;
  detailHospedaje: any = null;

  showCheckoutPanel = false;
  showConsumoModal = false;
  editConsumo: ConsumoResponse | null = null;

  consumos: ConsumoResponse[] = [];
  totalConsumos = 0;
  loadingConsumos = false;

  extensionFecha = '';
  loadingExtension = false;

  nuevaHabitacionId: number | null = null;
  loadingCambio = false;

  checkInReservaId: number | null = null;
  checkInMontoSaldo = 0;
  checkInMetodo = 'EFECTIVO';
  loadingCheckIn = false;

  directoClienteId: number | null = null;
  directoHabitacionId: number | null = null;
  directoNoches = 1;
  directoMontoPago = 0;
  directoMetodo = 'EFECTIVO';
  loadingDirecto = false;

  filterText = '';
  filteredHospedajes: any[] = [];
  incidenciasLimpieza: any[] = [];
  proximosCheckIns: any[] = [];

  /* Sort */
  sortField = '';
  sortDir: 'asc' | 'desc' = 'asc';

  get sortedHospedajes(): any[] {
    let list = this.filteredHospedajes;
    if (this.sortField) {
      list = [...list].sort((a, b) => {
        let va: string, vb: string;
        if (this.sortField === 'deudaPendiente') {
          va = String(a[this.sortField] || 0);
          vb = String(b[this.sortField] || 0);
        } else {
          va = (a[this.sortField] || '').toString().toLowerCase();
          vb = (b[this.sortField] || '').toString().toLowerCase();
        }
        return this.sortDir === 'asc' ? va.localeCompare(vb, undefined, { numeric: true }) : vb.localeCompare(va, undefined, { numeric: true });
      });
    }
    return list;
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
  }

  private filterSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadActivos();
    this.loadClientes();
    this.loadHabitaciones();
    this.loadIncidenciasLimpieza();
    this.loadProximosCheckIns();
    this.filterSubject.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(() => this.applyFilter());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.filterSubject.complete();
  }

  onFilterInput(): void {
    this.filterSubject.next(this.filterText);
  }

  applyFilter(): void {
    if (!this.filterText.trim()) { this.filteredHospedajes = [...this.hospedajes]; return; }
    const t = this.filterText.toLowerCase();
    this.filteredHospedajes = this.hospedajes.filter(h =>
      (h.clienteNombre || '').toLowerCase().includes(t) ||
      (h.habitacionNumero || '').toLowerCase().includes(t)
    );
  }

  loadActivos(): void {
    this.loading = true;
    this.hospedajeService.listarActivos().subscribe({
      next: res => { this.hospedajes = res.data || []; this.filteredHospedajes = [...this.hospedajes]; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadClientes(): void {
    this.clienteService.listarTodos().subscribe({
      next: res => this.clientes = res.data || []
    });
  }

  loadHabitaciones(): void {
    this.habService.listarActivas().subscribe(res => {
      const todas = res.data || [];
      this.totalHabitaciones = todas.length;
      this.habitacionesDisponibles = todas
        .filter((h: any) => h.estado === 'DISPONIBLE')
        .map((h: any) => ({ ...h, label: `${h.numero} - ${h.tipo} - S/${h.precioNoche}` }));
    });
  }

  loadIncidenciasLimpieza(): void {
    this.incidenciaService.listarActivas().subscribe({
      next: res => {
        this.incidenciasLimpieza = (res.data || []).filter((i: any) => i.tipo === 'LIMPIEZA');
      }
    });
  }

  loadProximosCheckIns(): void {
    this.reservaService.listarDelDia().subscribe({
      next: res => {
        this.proximosCheckIns = (res.data || []).filter((r: any) => r.estado === 'CONFIRMADA');
      }
    });
  }

  getTiempoTranscurrido(fecha: string): string {
    if (!fecha) return '';
    const ahora = new Date().getTime();
    const inicio = new Date(fecha).getTime();
    const diffMin = Math.floor((ahora - inicio) / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const horas = Math.floor(diffMin / 60);
    if (horas < 24) return `Hace ${horas}h`;
    return `Hace ${Math.floor(horas / 24)}d`;
  }

  selectHospedaje(id: number): void {
    this.selectedHospedajeId = id;
    this.hospedajeService.obtenerPorId(id).subscribe({
      next: res => {
        this.detailHospedaje = res.data;
        this.loadConsumos(id);
      }
    });
  }

  clearSelection(): void {
    this.selectedHospedajeId = null;
    this.detailHospedaje = null;
    this.consumos = [];
    this.totalConsumos = 0;
    this.extensionFecha = '';
    this.nuevaHabitacionId = null;
  }

  showCheckout(): void {
    this.showCheckoutPanel = true;
  }

  closeCheckout(): void {
    this.showCheckoutPanel = false;
    this.selectedHospedajeId = null;
  }

  loadConsumos(hospedajeId: number): void {
    this.loadingConsumos = true;
    this.consumoService.listarPorHospedaje(hospedajeId).subscribe({
      next: res => {
        this.consumos = res.data || [];
        this.totalConsumos = this.consumos.reduce((s, c) => s + (c.subtotal || 0), 0);
        this.loadingConsumos = false;
      },
      error: () => this.loadingConsumos = false
    });
  }

  abrirModalConsumo(): void {
    this.editConsumo = null;
    this.showConsumoModal = true;
  }

  editarConsumo(c: ConsumoResponse): void {
    this.editConsumo = c;
    this.showConsumoModal = true;
  }

  eliminarConsumo(id: number): void {
    this.confirmationService.confirm({
      message: '¿Eliminar este consumo?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.consumoService.eliminar(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Consumo eliminado' });
            this.loadConsumos(this.selectedHospedajeId!);
            if (this.selectedHospedajeId) this.selectHospedaje(this.selectedHospedajeId);
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al eliminar consumo' })
        });
      }
    });
  }

  onConsumoSaved(): void {
    this.loadConsumos(this.selectedHospedajeId!);
    if (this.selectedHospedajeId) this.selectHospedaje(this.selectedHospedajeId);
  }

  extenderEstadia(): void {
    if (!this.selectedHospedajeId || !this.extensionFecha) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione una nueva fecha de salida' });
      return;
    }
    this.loadingExtension = true;
    this.hospedajeService.extenderEstadia(this.selectedHospedajeId, {
      nuevaFechaSalida: new Date(this.extensionFecha).toISOString()
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estadía extendida correctamente' });
        this.loadingExtension = false;
        this.extensionFecha = '';
        this.selectHospedaje(this.selectedHospedajeId!);
        this.loadActivos();
      },
      error: (err) => { this.loadingExtension = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al extender' }); }
    });
  }

  cambiarHabitacion(): void {
    if (!this.selectedHospedajeId || !this.nuevaHabitacionId) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione una habitación' });
      return;
    }
    this.loadingCambio = true;
    this.hospedajeService.cambiarHabitacion(this.selectedHospedajeId, {
      nuevaHabitacionId: this.nuevaHabitacionId
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Habitación cambiada correctamente' });
        this.loadingCambio = false;
        this.nuevaHabitacionId = null;
        this.selectHospedaje(this.selectedHospedajeId!);
        this.loadActivos();
      },
      error: (err) => { this.loadingCambio = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al cambiar habitación' }); }
    });
  }

  doCheckIn(): void {
    if (!this.checkInReservaId) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese un ID de reserva' });
      return;
    }
    this.loadingCheckIn = true;
    this.hospedajeService.checkIn({
      reservaId: this.checkInReservaId,
      montoSaldo: this.checkInMontoSaldo || 0,
      metodoSaldo: this.checkInMetodo
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Check-in realizado' });
        this.loadingCheckIn = false;
        this.checkInReservaId = null;
        this.checkInMontoSaldo = 0;
        this.loadActivos();
      },
      error: (err) => { this.loadingCheckIn = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error en check-in' }); }
    });
  }

  doCheckInDirecto(): void {
    if (!this.directoClienteId || !this.directoHabitacionId) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione cliente y habitación' });
      return;
    }
    this.loadingDirecto = true;
    this.hospedajeService.checkInDirecto({
      clienteId: this.directoClienteId,
      habitacionId: this.directoHabitacionId,
      noches: this.directoNoches || 1,
      montoPago: this.directoMontoPago || 0,
      metodo: this.directoMetodo
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Check-in directo realizado' });
        this.loadingDirecto = false;
        this.directoClienteId = null;
        this.directoHabitacionId = null;
        this.directoNoches = 1;
        this.directoMontoPago = 0;
        this.loadActivos();
      },
      error: (err) => { this.loadingDirecto = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error en check-in directo' }); }
    });
  }

  formatFecha(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  showCheckoutFor(id: number): void {
    this.selectedHospedajeId = id;
    this.showCheckoutPanel = true;
  }

  verFacturaDeHospedaje(h: any): void {
    if (!h) return;
    const total = (h.totalPagado || 0) + (h.deudaPendiente || 0);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Factura #${h.id}</title><style>body{font-family:monospace;padding:40px;max-width:400px;margin:auto}hr{border:none;border-top:1px dashed #000}h2{text-align:center}.total{font-size:1.3em;font-weight:bold;text-align:right}</style></head><body>`);
    win.document.write(`<h2>FACTURA</h2><p>Hospedaje #${h.id}</p><hr>`);
    win.document.write(`<p><strong>Huésped:</strong> ${h.clienteNombre}</p>`);
    win.document.write(`<p><strong>Habitación:</strong> ${h.habitacionNumero}</p>`);
    win.document.write(`<p><strong>Ingreso:</strong> ${this.formatFecha(h.fechaIngreso)}</p>`);
    win.document.write(`<p><strong>Total:</strong> S/ ${total.toFixed(2)}</p>`);
    win.document.write(`<p><strong>Pagado:</strong> S/ ${(h.totalPagado || 0).toFixed(2)}</p>`);
    win.document.write(`<p><strong>Deuda:</strong> S/ ${(h.deudaPendiente || 0).toFixed(2)}</p><hr>`);
    win.document.write('<div style="text-align:center;margin-top:40px;color:#666">Gracias por su preferencia</div>');
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  }

  verFactura(): void {
    if (!this.detailHospedaje) return;
    const h = this.detailHospedaje;
    const win = window.open('', '_blank');
    if (!win) return;
    const total = (h.totalPagado || 0) + (h.deudaPendiente || 0);
    win.document.write(`<html><head><title>Factura #${h.id}</title><style>body{font-family:monospace;padding:40px;max-width:400px;margin:auto}hr{border:none;border-top:1px dashed #000}h2{text-align:center}.total{font-size:1.3em;font-weight:bold;text-align:right}</style></head><body>`);
    win.document.write(`<h2>FACTURA</h2><p>Hospedaje #${h.id}</p><hr>`);
    win.document.write(`<p><strong>Huésped:</strong> ${h.clienteNombre}</p>`);
    win.document.write(`<p><strong>Habitación:</strong> ${h.habitacionNumero} - ${h.habitacionTipo}</p>`);
    win.document.write(`<p><strong>Ingreso:</strong> ${this.formatFecha(h.fechaIngreso)}</p>`);
    win.document.write(`<p><strong>Salida Prog.:</strong> ${this.formatFecha(h.fechaSalidaProgramada)}</p><hr>`);
    win.document.write(`<p><strong>Total:</strong> S/ ${total.toFixed(2)}</p>`);
    win.document.write(`<p><strong>Pagado:</strong> S/ ${(h.totalPagado || 0).toFixed(2)}</p>`);
    win.document.write(`<p><strong>Deuda:</strong> S/ ${(h.deudaPendiente || 0).toFixed(2)}</p><hr>`);
    win.document.write('<div style="text-align:center;margin-top:40px;color:#666">Gracias por su preferencia</div>');
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  }

  getScheduledCheckouts(): number {
    return this.hospedajes.filter(h => {
      if (!h.fechaSalidaProgramada) return false;
      const diff = new Date(h.fechaSalidaProgramada).getTime() - new Date().getTime();
      return diff > 0 && diff < 86400000;
    }).length;
  }

  getTotalDeuda(): string {
    const total = this.hospedajes.reduce((s, h) => s + (h.deudaPendiente || 0), 0);
    return total.toFixed(2);
  }

  getOccupancyRate(): number {
    if (this.totalHabitaciones === 0) return 0;
    return Math.round((this.hospedajes.length / this.totalHabitaciones) * 100);
  }

  get costoDirectoTotal(): number {
    const hab = this.habitacionesDisponibles.find(h => h.id === this.directoHabitacionId);
    if (!hab || !this.directoNoches) return 0;
    return (hab.precioNoche || 0) * this.directoNoches;
  }

  get costoExtensionPreview(): number {
    if (!this.extensionFecha || !this.detailHospedaje) return 0;
    const actual = new Date(this.detailHospedaje.fechaSalidaProgramada);
    const nueva = new Date(this.extensionFecha);
    if (nueva <= actual) return 0;
    const diffMs = nueva.getTime() - actual.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const precio = this.detailHospedaje.habitacionPrecio || 0;
    return Math.max(0, diffDays) * precio;
  }

  formatFechaCorta(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}
