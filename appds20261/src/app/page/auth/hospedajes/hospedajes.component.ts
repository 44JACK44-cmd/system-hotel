import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospedajeService } from '../../../observable/hospedaje.service';
import { ConsumoService } from '../../../observable/consumo.service';
import { ClienteService } from '../../../observable/cliente.service';
import { HabitacionService } from '../../../observable/habitacion.service';
import { CheckOutComponent } from '../../../components/checkout/checkout.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-hospedajes',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, CheckOutComponent],
  providers: [MessageService],
  templateUrl: './hospedajes.component.html',
  styleUrls: ['./hospedajes.component.css']
})
export class HospedajesComponent implements OnInit {
  private hospedajeService = inject(HospedajeService);
  private consumoService = inject(ConsumoService);
  private clienteService = inject(ClienteService);
  private habService = inject(HabitacionService);
  private messageService = inject(MessageService);

  activeTab = 'activos';
  loading = false;
  hospedajes: any[] = [];
  clientes: any[] = [];
  habitacionesDisponibles: any[] = [];

  selectedHospedajeId: number | null = null;
  detailHospedaje: any = null;

  showCheckoutPanel = false;

  consumoDescripcion = '';
  consumoCantidad = 1;
  consumoPrecio = 0;
  consumos: any[] = [];
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

  get filteredHospedajes(): any[] {
    if (!this.filterText.trim()) return this.hospedajes;
    const t = this.filterText.toLowerCase();
    return this.hospedajes.filter(h =>
      (h.clienteNombre || '').toLowerCase().includes(t) ||
      (h.habitacionNumero || '').toLowerCase().includes(t)
    );
  }

  ngOnInit(): void {
    this.loadActivos();
    this.loadClientes();
    this.loadHabitaciones();
  }

  loadActivos(): void {
    this.loading = true;
    this.hospedajeService.listarActivos().subscribe({
      next: res => { this.hospedajes = res.data || []; this.loading = false; },
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
      this.habitacionesDisponibles = (res.data || [])
        .filter((h: any) => h.estado === 'DISPONIBLE')
        .map((h: any) => ({ ...h, label: `${h.numero} - ${h.tipo} - S/${h.precioNoche}` }));
    });
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
    this.consumoDescripcion = '';
    this.consumoCantidad = 1;
    this.consumoPrecio = 0;
    this.extensionFecha = '';
    this.nuevaHabitacionId = null;
  }

  showCheckout(): void {
    this.showCheckoutPanel = true;
  }

  closeCheckout(): void {
    this.showCheckoutPanel = false;
    this.loadActivos();
  }

  loadConsumos(hospedajeId: number): void {
    this.loadingConsumos = true;
    this.consumoService.listarPorHospedaje(hospedajeId).subscribe({
      next: res => { this.consumos = res.data || []; this.loadingConsumos = false; },
      error: () => this.loadingConsumos = false
    });
  }

  registrarConsumo(): void {
    if (!this.selectedHospedajeId || !this.consumoDescripcion.trim() || this.consumoCantidad < 1 || this.consumoPrecio <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Complete todos los campos del consumo' });
      return;
    }
    this.loading = true;
    this.consumoService.registrar({
      hospedajeId: this.selectedHospedajeId,
      descripcion: this.consumoDescripcion.trim(),
      cantidad: this.consumoCantidad,
      precioUnitario: this.consumoPrecio
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Consumo registrado' });
        this.loading = false;
        this.consumoDescripcion = '';
        this.consumoCantidad = 1;
        this.consumoPrecio = 0;
        this.loadConsumos(this.selectedHospedajeId!);
        this.selectHospedaje(this.selectedHospedajeId!);
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al registrar consumo' }); }
    });
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

  formatFechaCorta(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}
