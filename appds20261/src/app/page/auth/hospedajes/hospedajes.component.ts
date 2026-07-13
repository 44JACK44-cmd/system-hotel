import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HospedajeService } from '../../../observable/hospedaje.service';
import { ClienteService } from '../../../observable/cliente.service';
import { HabitacionService } from '../../../observable/habitacion.service';
import { ReservaService } from '../../../observable/reserva.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-hospedajes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './hospedajes.component.html',
  styleUrls: ['./hospedajes.component.css']
})
    
export class HospedajesComponent implements OnInit {
  private hospedajeService = inject(HospedajeService);
  private clienteService = inject(ClienteService);
  private habService = inject(HabitacionService);
  private reservaService = inject(ReservaService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  activeTab = 'activos';
  loading = false;
  hospedajes: any[] = [];
  todosHospedajes: any[] = [];
  clientes: any[] = [];
  habitacionesDisponibles: any[] = [];
  selectedHospedajeId: number | null = null;
  detailHospedaje: any = null;

  metodos = [{ label: 'Efectivo', value: 'EFECTIVO' }, { label: 'Yape', value: 'YAPE' }];

  generarBoleto(hospedajeId: number): void {
    this.hospedajeService.generarBoleto(hospedajeId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `boleto_hospedaje_${hospedajeId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Boleto generado correctamente' });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al generar boleto' });
      }
    });
  }

  onTabChange(tab: any): void {
    if (tab === 'activos') this.loadActivos();
    if (tab === 'checkout') this.loadActivos();
  }

  checkInForm = this.fb.group({
    reservaId: [null, Validators.required],
    montoSaldo: [0],
    metodoSaldo: ['EFECTIVO'],
    referencia: ['']
  });

  directoForm = this.fb.group({
    clienteId: [null, Validators.required],
    habitacionId: [null, Validators.required],
    noches: [1, Validators.required],
    montoPago: [0, Validators.required],
    metodo: ['EFECTIVO'],
    referencia: ['']
  });

  checkOutForm = this.fb.group({
    fechaSalidaReal: ['', Validators.required],
    montoExtension: [0],
    metodoExtension: ['EFECTIVO'],
    referenciaExtension: ['']
  });

  ngOnInit(): void {
    this.loadActivos();
    this.loadClientes();
    this.loadHabitaciones();
  }

  loadActivos(): void {
    this.loading = true;
    this.hospedajeService.listarActivos().subscribe({ next: res => { this.hospedajes = res.data || []; this.loading = false; }, error: () => this.loading = false });
  }

  loadClientes(): void {
    this.clienteService.listarTodos().subscribe({ next: res => this.clientes = res.data || [] });
  }

  loadHabitaciones(): void {
    this.habService.listarActivas().subscribe(res => {
      this.habitacionesDisponibles = (res.data || []).filter((h: any) => h.estado === 'DISPONIBLE')
        .map((h: any) => ({ ...h, label: `${h.numero} - ${h.tipo} - S/${h.precioNoche}` }));
    });
  }

  loadHospedajeDetail(): void {
    if (!this.selectedHospedajeId) { this.detailHospedaje = null; return; }
    this.hospedajeService.obtenerPorId(this.selectedHospedajeId).subscribe({ next: res => this.detailHospedaje = res.data });
  }

  setCurrentDateTime(): void {
    this.checkOutForm.patchValue({ fechaSalidaReal: new Date().toISOString().slice(0, 19) });
  }

  doCheckIn(): void {
    if (this.checkInForm.invalid) return;
    this.loading = true;
    this.hospedajeService.checkIn(this.checkInForm.value).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Check-in realizado' }); this.loading = false; this.loadActivos(); this.checkInForm.reset({ montoSaldo: 0, metodoSaldo: 'EFECTIVO' }); },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
    });
  }

  doCheckInDirecto(): void {
    if (this.directoForm.invalid) return;
    this.loading = true;
    this.hospedajeService.checkInDirecto(this.directoForm.value).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Check-in directo realizado' }); this.loading = false; this.loadActivos(); this.directoForm.reset({ noches: 1, montoPago: 0, metodo: 'EFECTIVO' }); },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
    });
  }

  doCheckOut(): void {
    if (!this.selectedHospedajeId || this.checkOutForm.invalid) return;
    this.loading = true;
    this.hospedajeService.checkOut(this.selectedHospedajeId, this.checkOutForm.value).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Check-out realizado' }); this.loading = false; this.loadActivos(); this.selectedHospedajeId = null; this.detailHospedaje = null; this.checkOutForm.reset({ montoExtension: 0, metodoExtension: 'EFECTIVO' }); },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
    });
  }
}
