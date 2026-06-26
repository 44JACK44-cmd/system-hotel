import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservaService } from '../../../observable/reserva.service';
import { ClienteService } from '../../../observable/cliente.service';
import { HabitacionService } from '../../../observable/habitacion.service';
import { AuthService } from '../../../observable/auth.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.css']
})
export class ReservasComponent implements OnInit {
  private reservaService = inject(ReservaService);
  private clienteService = inject(ClienteService);
  private habService = inject(HabitacionService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);

  reservas: any[] = [];
  clientes: any[] = [];
  habitaciones: any[] = [];
  newDialogVisible = false;
  detailVisible = false;
  selectedReserva: any = null;
  loading = false;

  get isAdmin(): boolean { return this.authService.isAdmin(); }

  reservaForm = this.fb.group({
    clienteSearch: [''],
    clienteId: [null as number | null, Validators.required],
    habitacionId: [null, Validators.required],
    fechaEntrada: ['', Validators.required],
    fechaSalida: ['', Validators.required],
    montoAdelanto: [0, [Validators.required, Validators.min(0.01)]],
    metodoAdelanto: ['YAPE', Validators.required],
    referenciaPago: [''],
    observacion: ['']
  });

  ngOnInit(): void {
    this.loadReservas();
    this.loadHabitaciones();
    this.loadClientes();
  }

  loadReservas(): void {
    this.reservaService.listarTodas().subscribe(res => this.reservas = res.data || []);
  }

  loadHabitaciones(): void {
    this.habService.listarActivas().subscribe(res => {
      this.habitaciones = (res.data || []).filter((h: any) => h.estado === 'DISPONIBLE')
        .map((h: any) => ({ ...h, label: `${h.numero} - ${h.tipo} - S/${h.precioNoche}` }));
    });
  }

  loadClientes(): void {
    this.clienteService.listarTodos().subscribe(res => this.clientes = res.data || []);
  }

  showNewDialog(): void {
    this.reservaForm.reset({ montoAdelanto: 0, metodoAdelanto: 'YAPE' });
    this.newDialogVisible = true;
  }

  searchCliente(): void {
    const tel = this.reservaForm.get('clienteSearch')?.value;
    if (tel) {
      this.clienteService.buscarPorTelefono(tel).subscribe({
        next: (res) => {
          this.reservaForm.patchValue({ clienteId: res.data?.id });
          this.messageService.add({ severity: 'info', summary: 'Cliente encontrado', detail: res.data?.nombreCompleto });
        },
        error: () => this.messageService.add({ severity: 'warn', summary: 'No encontrado', detail: 'Cree el cliente primero' })
      });
    }
  }

  saveReserva(): void {
    if (this.reservaForm.invalid) return;
    const data = this.reservaForm.value;
    this.reservaService.crear({
      clienteId: data.clienteId,
      habitacionId: data.habitacionId,
      fechaEntrada: data.fechaEntrada,
      fechaSalida: data.fechaSalida,
      montoAdelanto: data.montoAdelanto,
      metodoAdelanto: data.metodoAdelanto,
      referenciaPago: data.referenciaPago || null,
      observacion: data.observacion || null
    }).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Reserva creada' }); this.newDialogVisible = false; this.loadReservas(); },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' })
    });
  }

  showDetail(r: any): void {
    this.selectedReserva = r;
    this.detailVisible = true;
  }

  getReservaBadge(estado: string): string {
    const map: Record<string, string> = {
      CONFIRMADA: 'badge-confirmed',
      PENDIENTE: 'badge-pending',
      CANCELADA: 'badge-cancelled',
      NO_SHOW: 'badge-error',
      CONCRETADA: 'badge-success'
    };
    return map[estado] || 'badge-info';
  }

  cancelReserva(r: any): void {
    // RN-12: solo ADMIN puede cancelar reservas
    if (!this.isAdmin) {
      this.messageService.add({ severity: 'error', summary: 'RN-12', detail: 'Solo el ADMIN puede cancelar reservas' });
      return;
    }
    this.confirmationService.confirm({
      message: 'Seguro de cancelar esta reserva? El adelanto no se devuelve.',
      accept: () => {
        this.reservaService.cancelar(r.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Cancelada', detail: 'Reserva cancelada' }); this.loadReservas(); },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' })
        });
      }
    });
  }
}
