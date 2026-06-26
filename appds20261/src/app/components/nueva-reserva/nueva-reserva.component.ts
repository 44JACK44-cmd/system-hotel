import { Component, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HabitacionService } from '../../observable/habitacion.service';
import { ClienteService } from '../../observable/cliente.service';
import { ReservaService } from '../../observable/reserva.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-nueva-reserva',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, InputTextModule, ButtonModule, SelectModule, InputNumberModule, TextareaModule, RadioButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './nueva-reserva.component.html',
  styleUrl: './nueva-reserva.component.css'
})
export class NuevaReservaComponent implements OnInit {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  private habitacionService = inject(HabitacionService);
  private clienteService = inject(ClienteService);
  private reservaService = inject(ReservaService);
  private messageService = inject(MessageService);

  searchTerm = '';
  clientes: any[] = [];
  selectedCliente: any = null;
  loading = false;
  habitaciones: any[] = [];
  precioNoche = 0;
  noches = 0;
  montoTotal = 0;
  montoTotalDisplay = '0.00';
  montoMaximoAdelanto = 0;
  saldoPendiente = 0;
  habitacionSeleccionada: any = null;

  nuevoCliente = { nombreCompleto: '', telefono: '', documento: '', email: '' };

  reservaData: any = {
    habitacionId: null,
    fechaEntrada: '',
    fechaSalida: '',
    adelanto: 0,
    metodoPago: 'YAPE',
    observaciones: ''
  };

  ngOnInit(): void {
    this.cargarHabitaciones();
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
      const inicio = new Date(this.reservaData.fechaEntrada);
      const fin = new Date(this.reservaData.fechaSalida);
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

  buscarCliente(): void {
    if (!this.searchTerm.trim()) return;
    this.clienteService.buscar(this.searchTerm).subscribe(res => {
      this.clientes = res.data || [];
    });
  }

  puedeGuardar(): boolean {
    return !!(this.reservaData.habitacionId && this.reservaData.fechaEntrada && this.reservaData.fechaSalida && this.reservaData.adelanto > 0);
  }

  guardar(): void {
    if ((this.reservaData.adelanto || 0) > this.montoMaximoAdelanto) {
      this.messageService.add({ severity: 'warn', summary: 'Adelanto inválido', detail: 'El adelanto no puede superar el monto total (S/. ' + this.montoMaximoAdelanto.toFixed(2) + ')' });
      return;
    }

    this.loading = true;
    const doCreate = (clienteId: number) => {
      const payload: any = {
        clienteId,
        habitacionId: this.reservaData.habitacionId,
        fechaEntrada: this.reservaData.fechaEntrada,
        fechaSalida: this.reservaData.fechaSalida,
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
              setTimeout(() => this.cerrar(), 1000);
            },
            error: (err) => {
              this.loading = false;
              this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear reserva' });
            }
          });
        },
        error: () => {
          this.reservaService.crear(payload).subscribe({
            next: () => {
              this.loading = false;
              this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva creada correctamente' });
              setTimeout(() => this.cerrar(), 1000);
            },
            error: (err) => {
              this.loading = false;
              this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear reserva' });
            }
          });
        }
      });
    };

    if (this.selectedCliente?.id) {
      doCreate(this.selectedCliente.id);
    } else if (this.nuevoCliente.nombreCompleto && this.nuevoCliente.telefono) {
      this.clienteService.crear(this.nuevoCliente).subscribe({
        next: (res: any) => doCreate(res.data?.id || res.data),
        error: () => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear cliente' });
        }
      });
    } else {
      this.loading = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Seleccione o cree un cliente' });
    }
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
    this.clientes = [];
    this.selectedCliente = null;
    this.nuevoCliente = { nombreCompleto: '', telefono: '', documento: '', email: '' };
    this.reservaData = {
      habitacionId: null,
      fechaEntrada: '',
      fechaSalida: '',
      adelanto: 0,
      metodoPago: 'YAPE',
      observaciones: ''
    };
    this.close.emit();
  }
}
