import { Component, inject, OnInit } from '@angular/core';
import { ClienteService } from '../../../observable/cliente.service';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from "primeng/toast";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [ToastModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  private clienteService = inject(ClienteService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  clientes: any[] = [];
  loading = false;
  dialogVisible = false;
  editing = false;
  editingId: number | null = null;
  searchTerm = '';
  historialVisible = false;
  selectedCliente: any = null;
  historialReservas: any[] = [];
  historialHospedajes: any[] = [];
  historialTab = '0';

  clienteForm = this.fb.group({
    nombreCompleto: ['', Validators.required],
    telefono: ['', Validators.required],
    documento: [''],
    email: ['']
  });

  ngOnInit(): void { this.loadClientes(); }

  loadClientes(): void {
    this.loading = true;
    this.clienteService.listarTodos().subscribe({ next: res => { this.clientes = res.data || []; this.loading = false; }, error: () => this.loading = false });
  }

  search(): void {
    if (this.searchTerm.length < 2) { this.loadClientes(); return; }
    this.loading = true;
    this.clienteService.buscar(this.searchTerm).subscribe({ next: res => { this.clientes = res.data || []; this.loading = false; }, error: () => this.loading = false });
  }

  showDialog(): void {
    this.editing = false; this.editingId = null;
    this.clienteForm.reset();
    this.dialogVisible = true;
  }

  editCliente(c: any): void {
    this.editing = true; this.editingId = c.id;
    this.clienteForm.patchValue(c);
    this.dialogVisible = true;
  }

  save(): void {
    if (this.clienteForm.invalid) return;
    this.loading = true;
    if (this.editing && this.editingId) {
      this.clienteService.actualizar(this.editingId, this.clienteForm.value).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Cliente actualizado' }); this.dialogVisible = false; this.loading = false; this.loadClientes(); },
        error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
      });
    } else {
      this.clienteService.crear(this.clienteForm.value).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Cliente creado' }); this.dialogVisible = false; this.loading = false; this.loadClientes(); },
        error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
      });
    }
  }

  showHistorial(c: any): void {
    this.selectedCliente = c;
    this.historialVisible = true;
    this.clienteService.historialReservas(c.id).subscribe(res => this.historialReservas = res.data || []);
    this.clienteService.historialHospedajes(c.id).subscribe(res => this.historialHospedajes = res.data || []);
  }
}
