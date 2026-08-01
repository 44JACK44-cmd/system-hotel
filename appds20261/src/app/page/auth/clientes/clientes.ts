import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy } from '@angular/core';
import { ClienteService } from '../../../observable/cliente.service';
import { AuthService } from '../../../observable/auth.service';
import { PagoService } from '../../../observable/pago.service';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { InputNumberModule } from 'primeng/inputnumber';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PageResponse } from '../../../shared/models';
import { LayoutStateService } from '../../../services/layout-state.service';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [ToastModule, ConfirmDialogModule, PaginatorModule, FormsModule, ReactiveFormsModule, CommonModule, InputNumberModule],
  providers: [ConfirmationService],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit, OnDestroy {
  private clienteService = inject(ClienteService);
  private authService = inject(AuthService);
  private pagoService = inject(PagoService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private layoutState = inject(LayoutStateService);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private estadoActualizacion = inject(EstadoActualizacionService);

  clientes: any[] = [];
  loading = false;
  dialogVisible = false;
  editing = false;
  editingId: number | null = null;
  searchTerm = '';
  includeInactivos = localStorage.getItem('cli_includeInactivos') !== 'false';
  historialVisible = false;
  selectedCliente: any = null;
  historialReservas: any[] = [];
  historialHospedajes: any[] = [];
  historialTab = '0';
  detailCliente: any = null;
  private detailClienteToken = 0;

  showCobrarModal = false;
  deudaSeleccionada: any = null;
  cobrarMonto = 0;
  cobrarMetodo = 'EFECTIVO';
  cobrarReferencia = '';
  cobrarObservacion = '';
  loadingCobrar = false;

  /* Server-side pagination */
  page = 0;
  pageSize = 20;
  totalRecords = 0;
  sortField = '';
  sortDir: 'asc' | 'desc' = 'asc';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  clienteForm = this.fb.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60), this.nombreSoloLetras]],
    tipoDocumento: ['DNI'],
    documento: ['', [Validators.maxLength(20)]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{6,12}$/)]],
    codigoPais: ['+51', [Validators.pattern(/^\+?[0-9]{1,4}$/)]],
    email: ['', [Validators.email, Validators.maxLength(100)]]
  });

  private nombreSoloLetras(control: any): { [key: string]: any } | null {
    if (!control.value) return null;
    const v = String(control.value).trim();
    if (/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]/.test(v)) return { letrasInvalidas: true };
    if (/\s{2,}/.test(v)) return { espaciosDobles: true };
    return null;
  }

  ngOnInit(): void {
    this.loadClientes();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => { this.page = 0; this.loadClientes(); });
    this.estadoActualizacion.on('CLIENTE_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.loadClientes());
    this.estadoActualizacion.on('HOSPEDAJE_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshClienteContext());
    this.estadoActualizacion.on('RESERVA_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshClienteContext());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  loadClientes(): void {
    this.loading = true;
    this.clienteService.listarPaginado(this.page, this.pageSize, this.sortField || undefined, this.sortDir, this.searchTerm || undefined, this.includeInactivos).subscribe({
      next: (res: PageResponse<any>) => {
        const data = res.content || [];
        const total = res.totalElements ?? 0;
        this.clientes = data;
        if (this.detailCliente) {
          this.detailCliente = data.find(c => c.id === this.detailCliente.id) || this.detailCliente;
        }
        this.totalRecords = total;
        this.loading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.appRef.tick();
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || 'Error al cargar clientes' }); this.appRef.tick(); }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  toggleInactivos(): void {
    this.includeInactivos = !this.includeInactivos;
    localStorage.setItem('cli_includeInactivos', String(this.includeInactivos));
    this.page = 0;
    this.loadClientes();
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
    this.layoutState.setOverlay(true);
  }

  editCliente(c: any): void {
    this.editing = true; this.editingId = c.id;
    this.clienteForm.patchValue({
      nombreCompleto: c.nombreCompleto,
      tipoDocumento: c.tipoDocumento || 'DNI',
      documento: c.documento,
      telefono: c.telefono,
      codigoPais: c.codigoPais || '+51',
      email: c.email
    });
    this.dialogVisible = true;
    this.layoutState.setOverlay(true);
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.layoutState.setOverlay(false);
  }

  closeHistorial(): void {
    this.historialVisible = false;
    this.layoutState.setOverlay(false);
  }

  save(): void {
    if (this.clienteForm.invalid) return;
    const v = this.clienteForm.value;
    const payload: any = {
      nombreCompleto: v.nombreCompleto?.trim().replace(/\s{2,}/g, ' '),
      tipoDocumento: v.tipoDocumento || 'DNI',
      documento: v.documento?.trim() || null,
      telefono: v.telefono?.trim(),
      codigoPais: v.codigoPais?.trim() || '+51',
      email: v.email?.trim().toLowerCase() || null
    };
    this.loading = true;
    if (this.editing && this.editingId) {
      this.clienteService.actualizar(this.editingId, payload).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Cliente actualizado' }); this.dialogVisible = false; this.layoutState.setOverlay(false); this.loading = false; this.loadClientes(); this.estadoActualizacion.clienteCambio(); },
        error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error' }); }
      });
    } else {
      this.clienteService.crear(payload).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Cliente creado' }); this.dialogVisible = false; this.layoutState.setOverlay(false); this.loading = false; this.loadClientes(); this.estadoActualizacion.clienteCambio(); },
        error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error' }); }
      });
    }
  }

  showHistorial(c: any): void {
    this.selectedCliente = c;
    this.historialVisible = true;
    this.layoutState.setOverlay(true);
    this.refreshClienteContext();
  }

  onSelectCliente(c: any): void {
    this.detailCliente = c;
    this.historialReservas = [];
    this.historialHospedajes = [];
    this.refreshClienteContext();
  }

  private refreshClienteContext(): void {
    const cliente = this.selectedCliente || this.detailCliente;
    if (!cliente?.id) return;
    const token = ++this.detailClienteToken;
    this.clienteService.historialReservas(cliente.id).subscribe(res => {
      if (token !== this.detailClienteToken) return;
      this.historialReservas = res.data || [];
    });
    this.clienteService.historialHospedajes(cliente.id).subscribe(res => {
      if (token !== this.detailClienteToken) return;
      this.historialHospedajes = res.data || [];
    });
    this.loadClientes();
  }

  nuevaReservaDesdeCliente(c: any): void {
    this.messageService.add({ severity: 'info', summary: 'Redirigiendo', detail: 'Abriendo nueva reserva...' });
    this.router.navigate(['/recepcion/reservas'], { queryParams: { clienteId: c.id } });
  }

  private normalizarTelefonoParaWhatsApp(tel: string): string {
    let num = tel.replace(/[\s\-\(\)]/g, '').replace(/[^0-9+]/g, '');
    if (!num.startsWith('+')) {
      if (num.startsWith('51')) { num = '+' + num; }
      else { num = '+51' + num; }
    }
    return num;
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  confirmarDesactivar(c: any): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de desactivar al cliente "${c.nombreCompleto}"? Dejará de aparecer en búsquedas.`,
      header: 'Desactivar cliente',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.clienteService.deactivate(c.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Cliente desactivado' }); this.loadClientes(); this.estadoActualizacion.clienteCambio(); if (this.detailCliente?.id === c.id) { this.detailCliente = null; } },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || 'Error al desactivar' })
        });
      }
    });
  }

  confirmarReactivar(c: any): void {
    this.confirmationService.confirm({
      message: `¿Reactivar al cliente "${c.nombreCompleto}"?`,
      header: 'Reactivar cliente',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Sí, reactivar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.clienteService.activate(c.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Cliente reactivado' }); this.loadClientes(); this.estadoActualizacion.clienteCambio(); if (this.detailCliente?.id === c.id) { this.detailCliente = null; } },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || 'Error al reactivar' })
        });
      }
    });
  }

  confirmarEliminacion(c: any): void {
    this.confirmationService.confirm({
      message: `¿Eliminar permanentemente al cliente "${c.nombreCompleto}"? Esta acción no se puede deshacer.`,
      header: 'Eliminar cliente',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.clienteService.safeDelete(c.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Cliente eliminado' }); this.loadClientes(); this.estadoActualizacion.clienteCambio(); if (this.detailCliente?.id === c.id) { this.detailCliente = null; } },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || 'Error al eliminar' })
        });
      }
    });
  }

  contactarCliente(c: any): void {
    if (c.telefono) {
      const num = this.normalizarTelefonoParaWhatsApp(c.telefono);
      window.open(`https://wa.me/${num}`, '_blank');
    } else if (c.email) {
      window.open(`mailto:${c.email}`);
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Sin contacto', detail: 'El cliente no tiene teléfono ni email registrado' });
    }
  }

  abrirCobrar(deuda: any): void {
    this.deudaSeleccionada = deuda;
    this.cobrarMonto = deuda.deudaPendiente;
    this.cobrarMetodo = 'EFECTIVO';
    this.cobrarReferencia = '';
    this.cobrarObservacion = '';
    this.showCobrarModal = true;
  }

  confirmarCobro(): void {
    if (!this.deudaSeleccionada || this.cobrarMonto <= 0) return;
    if (this.cobrarMonto > this.deudaSeleccionada.deudaPendiente) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'El monto no puede exceder la deuda pendiente' });
      return;
    }
    this.loadingCobrar = true;
    this.pagoService.registrar({
      tipo: 'SALDO',
      monto: this.cobrarMonto,
      metodo: this.cobrarMetodo,
      referencia: this.cobrarReferencia || null,
      hospedajeId: this.deudaSeleccionada.id,
      observacion: this.cobrarObservacion || null
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Pago registrado exitosamente' });
        this.showCobrarModal = false;
        this.loadingCobrar = false;
        this.refreshClienteContext();
        this.estadoActualizacion.pagoCambio();
        this.estadoActualizacion.hospedajeCambio();
      },
      error: (err) => {
        this.loadingCobrar = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al registrar pago' });
      }
    });
  }
}
