import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ClienteService } from '../../../observable/cliente.service';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from "primeng/toast";
import { PaginatorModule } from 'primeng/paginator';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageResponse } from '../../../shared/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [ToastModule, PaginatorModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit, OnDestroy {
  private clienteService = inject(ClienteService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private router = inject(Router);

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
  detailCliente: any = null;

  /* Server-side pagination */
  page = 0;
  pageSize = 20;
  totalRecords = 0;
  sortField = '';
  sortDir: 'asc' | 'desc' = 'asc';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  clienteForm = this.fb.group({
    nombreCompleto: ['', Validators.required],
    telefono: ['', Validators.required],
    documento: [''],
    email: ['']
  });

  ngOnInit(): void {
    this.loadClientes();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => { this.page = 0; this.loadClientes(); });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  loadClientes(): void {
    this.loading = true;
    this.clienteService.listarPaginado(this.page, this.pageSize, this.sortField || undefined, this.sortDir, this.searchTerm || undefined).subscribe({
      next: (res: PageResponse<any>) => {
        this.clientes = res.content;
        this.totalRecords = res.totalElements;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(event: any): void {
    this.page = event.page;
    this.pageSize = event.rows;
    this.loadClientes();
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.page = 0;
    this.loadClientes();
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

  nuevaReservaDesdeCliente(c: any): void {
    this.messageService.add({ severity: 'info', summary: 'Redirigiendo', detail: 'Abriendo nueva reserva...' });
    this.router.navigate(['/reservas']);
  }

  contactarCliente(c: any): void {
    if (c.telefono) {
      window.open(`https://wa.me/${c.telefono.replace(/\s/g, '')}`, '_blank');
    } else if (c.email) {
      window.open(`mailto:${c.email}`);
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Sin contacto', detail: 'El cliente no tiene teléfono ni email registrado' });
    }
  }
}
