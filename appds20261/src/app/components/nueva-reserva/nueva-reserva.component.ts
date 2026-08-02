import { Component, inject, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HabitacionService } from '../../observable/habitacion.service';
import { ClienteService } from '../../observable/cliente.service';
import { ReservaService } from '../../observable/reserva.service';
import { ClienteQuickCreateComponent } from '../cliente-quick-create/cliente-quick-create.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LayoutStateService } from '../../services/layout-state.service';
import { EstadoActualizacionService } from '../../services/estado-actualizacion.service';

@Component({
  selector: 'app-nueva-reserva',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AutoCompleteModule, InputTextModule, ButtonModule, SelectModule, InputNumberModule, TextareaModule, RadioButtonModule, DatePickerModule, ToastModule, ClienteQuickCreateComponent],
  providers: [MessageService],
  templateUrl: './nueva-reserva.component.html',
  styleUrl: './nueva-reserva.component.css'
})
export class NuevaReservaComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  private habitacionService = inject(HabitacionService);
  private clienteService = inject(ClienteService);
  private reservaService = inject(ReservaService);
  private messageService = inject(MessageService);
  private layoutState = inject(LayoutStateService);
  private estadoActualizacion = inject(EstadoActualizacionService);

  searchTerm = '';
  clientesSugerencias: any[] = [];
  showQuickCreateCliente = false;
  clientes: any[] = [];
  selectedCliente: any = null;

  onSearchTermChange(): void {
    this.clientes = [];
    this.selectedCliente = null;
  }
  loading = false;
  habitaciones: any[] = [];
  precioNoche = 0;
  noches = 0;
  montoTotal = 0;
  montoTotalDisplay = '0.00';
  montoMaximoAdelanto = 0;
  saldoPendiente = 0;
  habitacionSeleccionada: any = null;

  reservaData: any = {
    habitacionId: null,
    fechaEntrada: null,
    fechaSalida: null,
    adelanto: 0,
    metodoPago: 'YAPE',
    observaciones: ''
  };

  ngOnInit(): void {
    this.layoutState.setOverlay(true);
    this.cargarHabitaciones();
  }

  ngOnDestroy(): void {
    this.layoutState.setOverlay(false);
  }

  cargarHabitaciones(): void {
    this.habitacionService.listarActivas().subscribe({
      next: (res) => {
        const disponibles = (res.data || []).filter((h: any) => h.estado === 'DISPONIBLE');
        this.habitaciones = disponibles.map((h: any) => ({
          ...h,
          label: `${h.numero} - ${h.tipo} - S/${h.precioNoche}`
        }));
      },
      error: (err) => console.error('Error cargando habitaciones:', err)
    });
  }

  onHabitacionChange(): void {
    const hab = this.habitaciones.find(h => h.id == this.reservaData.habitacionId);
    this.habitacionSeleccionada = hab || null;
    this.precioNoche = hab?.precioNoche || 0;
    this.recalcular();
  }

  recalcular(): void {
    if (this.reservaData.fechaEntrada && this.reservaData.fechaSalida && this.precioNoche > 0) {
      const inicio = this.reservaData.fechaEntrada;
      const fin = this.reservaData.fechaSalida;
      const diff = fin.getTime() - inicio.getTime();
      this.noches = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      this.montoTotal = this.noches * this.precioNoche;
    } else {
      this.noches = 0;
      this.montoTotal = 0;
    }
    this.montoTotalDisplay = this.montoTotal.toFixed(2);
    this.montoMaximoAdelanto = this.montoTotal;
    this.saldoPendiente = this.montoTotal - (this.reservaData.adelanto || 0);
  }

  buscarCliente(event: any): void {
    const query = event?.query?.trim() || this.searchTerm?.trim();
    if (!query || query.length < 1) { this.clientesSugerencias = []; return; }
    this.clienteService.buscar(query).subscribe({
      next: res => {
        this.clientesSugerencias = (res.data || []).map((c: any) => ({
          ...c,
          label: `${c.nombreCompleto} - ${c.documento || ''}`,
          subtitle: `${c.email || ''} ${c.telefono || ''}`
        }));
      },
      error: () => this.clientesSugerencias = []
    });
  }

  onClienteAutoSelected(sug: any): void {
    if (!sug) return;
    this.selectedCliente = sug;
    this.searchTerm = sug.label || sug.nombreCompleto;
  }

  puedeGuardar(): boolean {
    const { habitacionId, fechaEntrada, fechaSalida, adelanto } = this.reservaData;
    const ok1 = !!habitacionId;
    const ok2 = !!fechaEntrada;
    const ok3 = !!fechaSalida;
    const ok4 = Number(adelanto) > 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const entrada = fechaEntrada ? new Date(fechaEntrada) : null;
    entrada?.setHours(0, 0, 0, 0);
    const ok6 = !entrada || entrada >= hoy;
    const nochesCalc = (!!fechaEntrada && !!fechaSalida && this.precioNoche > 0)
      ? Math.max(0, Math.ceil((new Date(fechaSalida).getTime() - new Date(fechaEntrada).getTime()) / 86400000))
      : 0;
    const ok5 = nochesCalc > 0;
    return ok1 && ok2 && ok3 && ok4 && ok5 && ok6;
  }

  guardar(): void {
    if (!this.reservaData.fechaEntrada || !this.reservaData.fechaSalida) {
      this.messageService.add({ severity: 'error', summary: 'Fechas requeridas', detail: 'Debe seleccionar fecha de entrada y fecha de salida' });
      return;
    }
    if (!this.reservaData.habitacionId) {
      this.messageService.add({ severity: 'error', summary: 'Habitación requerida', detail: 'Debe seleccionar una habitación' });
      return;
    }
    this.recalcular();
    if (this.noches <= 0) {
      this.messageService.add({ severity: 'error', summary: 'Fechas inválidas', detail: 'La cantidad de noches debe ser mayor a cero' });
      return;
    }
    if (Number(this.reservaData.adelanto) > 0 && !/^\d+(\.\d{1,2})?$/.test(String(this.reservaData.adelanto))) {
      this.messageService.add({ severity: 'error', summary: 'Adelanto inválido', detail: 'El adelanto debe tener como máximo 2 decimales' });
      return;
    }
    if ((this.reservaData.adelanto || 0) > this.montoMaximoAdelanto) {
      this.messageService.add({ severity: 'warn', summary: 'Adelanto inválido', detail: 'El adelanto no puede superar el monto total (S/. ' + this.montoMaximoAdelanto.toFixed(2) + ')' });
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaEntrada = new Date(this.reservaData.fechaEntrada);
    fechaEntrada.setHours(0, 0, 0, 0);
    if (fechaEntrada < hoy) {
      this.messageService.add({ severity: 'error', summary: 'Fecha inválida', detail: 'La fecha de entrada no puede ser anterior a hoy' });
      return;
    }
    const salida = new Date(this.reservaData.fechaSalida);
    salida.setHours(0, 0, 0, 0);
    if (salida <= fechaEntrada) {
      this.messageService.add({ severity: 'error', summary: 'Fechas inválidas', detail: 'La fecha de salida debe ser posterior a la fecha de entrada' });
      return;
    }

    if (!this.selectedCliente?.id) {
      this.loading = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Seleccione o cree un cliente' });
      return;
    }
    this.loading = true;
    const toDateStr = (d: any): string => {
      if (d instanceof Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return d;
    };
    const payload: any = {
      clienteId: this.selectedCliente.id,
      habitacionId: this.reservaData.habitacionId,
      fechaEntrada: toDateStr(this.reservaData.fechaEntrada),
      fechaSalida: toDateStr(this.reservaData.fechaSalida),
      montoAdelanto: this.reservaData.adelanto,
      metodoAdelanto: this.reservaData.metodoPago,
      observacion: this.reservaData.observaciones
    };
    this.reservaService.verificarDisponibilidad(payload.habitacionId, payload.fechaEntrada, payload.fechaSalida).subscribe({
      next: (disp: any) => {
        if (disp.data === false) {
          this.loading = false;
          this.messageService.add({ severity: 'warn', summary: 'No disponible', detail: 'La habitación no está disponible en esas fechas' });
          return;
        }
        this.reservaService.crear(payload).subscribe({
          next: () => {
            this.loading = false;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva creada correctamente' });
            this.estadoActualizacion.reservaCambio();
            this.estadoActualizacion.habitacionCambio();
            setTimeout(() => this.cerrar(), 1000);
          },
          error: (err) => {
            this.loading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error al crear reserva' });
          }
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al verificar disponibilidad. Intente nuevamente.' });
      }
    });
  }

  abrirQuickCreateCliente(): void {
    this.showQuickCreateCliente = true;
  }

  onClienteCreado(cliente: any): void {
    this.showQuickCreateCliente = false;
    this.selectedCliente = { ...cliente, label: `${cliente.nombreCompleto} - ${cliente.documento || ''}` };
    this.clientesSugerencias = [];
    this.searchTerm = cliente.nombreCompleto || '';
  }

  cerrarQuickCreateCliente(): void {
    this.showQuickCreateCliente = false;
  }

  cerrar(): void {
    this.precioNoche = 0;
    this.noches = 0;
    this.montoTotal = 0;
    this.montoTotalDisplay = '0.00';
    this.montoMaximoAdelanto = 0;
    this.saldoPendiente = 0;
    this.habitacionSeleccionada = null;
    this.searchTerm = '';
    this.clientesSugerencias = [];
    this.clientes = [];
    this.selectedCliente = null;
    this.reservaData = {
      habitacionId: null,
      fechaEntrada: null,
      fechaSalida: null,
      adelanto: 0,
      metodoPago: 'YAPE',
      observaciones: ''
    };
    this.layoutState.setOverlay(false);
    this.close.emit();
  }
}
