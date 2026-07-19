import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../../../observable/pago.service';
import { EgresoService } from '../../../observable/egreso.service';
import { CajaService } from '../../../observable/caja.service';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageResponse } from '../../../shared/models';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, SelectModule, InputNumberModule, PaginatorModule],
  providers: [MessageService],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit, OnDestroy {
  private pagoService = inject(PagoService);
  private egresoService = inject(EgresoService);
  private cajaService = inject(CajaService);
  private messageService = inject(MessageService);

  Math = Math;
  pagos: any[] = [];
  allPagos: any[] = [];
  egresos: any[] = [];
  loading = false;
  dialogVisible = false;
  searchTerm = '';

  /* Server-side pagination */
  page = 0;
  pageSize = 20;
  totalRecords = 0;
  sortField = '';
  sortDir: 'asc' | 'desc' = 'asc';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  cajaActual: any = null;
  showCierreModal = false;
  cierreMontoFisico = 0;
  cierreObservacion = '';

  gastoConcepto = '';
  gastoCategoria = 'Mantenimiento';
  gastoMonto = 0;
  loadingGasto = false;

  pagoTipo = 'SALDO';
  pagoMonto = 0;
  pagoMetodo = 'EFECTIVO';
  pagoReferencia = '';
  pagoReservaId: number | null = null;
  pagoHospedajeId: number | null = null;
  pagoObservacion = '';
  loadingPago = false;

  ngOnInit(): void {
    this.loadAllPagos();
    this.loadAllEgresos();
    this.loadCaja();
    this.loadPagos();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => { this.page = 0; this.loadPagos(); });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  /* Stats computed from full data */
  get totalEfectivo(): number {
    return this.allPagos.filter(p => p.metodo === 'EFECTIVO').reduce((s, p) => s + (p.monto || 0), 0);
  }

  get totalYape(): number {
    return this.allPagos.filter(p => p.metodo === 'YAPE').reduce((s, p) => s + (p.monto || 0), 0);
  }

  get totalIngresos(): number {
    return this.totalEfectivo + this.totalYape;
  }

  get totalEgresosMonto(): number {
    return this.egresos.reduce((s, e) => s + (e.monto || 0), 0);
  }

  get balanceNeto(): number {
    return this.totalIngresos - this.totalEgresosMonto;
  }

  getPagoBadge(tipo: string): string {
    const map: Record<string, string> = {
      ADELANTO: 'badge-info',
      SALDO: 'badge-success',
      EXTENSION: 'badge-confirmed'
    };
    return map[tipo] || 'badge-info';
  }

  loadAllPagos(): void {
    this.pagoService.listarTodos().subscribe({
      next: res => { this.allPagos = res.data || []; }
    });
  }

  loadAllEgresos(): void {
    this.egresoService.listarTodos().subscribe({
      next: res => this.egresos = res.data || []
    });
  }

  loadPagos(): void {
    this.loading = true;
    this.pagoService.listarPaginado(this.page, this.pageSize, this.sortField || undefined, this.sortDir, this.searchTerm || undefined).subscribe({
      next: (res: PageResponse<any>) => {
        this.pagos = res.content;
        this.totalRecords = res.totalElements;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadCaja(): void {
    this.cajaService.obtenerActual().subscribe({
      next: res => this.cajaActual = res.data
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(event: any): void {
    this.page = event.page;
    this.pageSize = event.rows;
    this.loadPagos();
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.page = 0;
    this.loadPagos();
  }

  registrarGasto(): void {
    if (!this.gastoConcepto.trim() || this.gastoMonto <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Complete concepto y monto del gasto' });
      return;
    }
    this.loadingGasto = true;
    this.egresoService.registrar({
      concepto: this.gastoConcepto.trim(),
      categoria: this.gastoCategoria,
      monto: this.gastoMonto
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto registrado' });
        this.loadingGasto = false;
        this.gastoConcepto = '';
        this.gastoMonto = 0;
        this.loadAllEgresos();
      },
      error: (err) => { this.loadingGasto = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al registrar gasto' }); }
    });
  }

  showDialog(): void {
    this.pagoTipo = 'SALDO';
    this.pagoMonto = 0;
    this.pagoMetodo = 'EFECTIVO';
    this.pagoReferencia = '';
    this.pagoReservaId = null;
    this.pagoHospedajeId = null;
    this.pagoObservacion = '';
    this.dialogVisible = true;
  }

  savePago(): void {
    if (this.pagoMonto <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El monto debe ser mayor a cero' });
      return;
    }
    this.loadingPago = true;
    this.pagoService.registrar({
      tipo: this.pagoTipo,
      monto: this.pagoMonto,
      metodo: this.pagoMetodo,
      referencia: this.pagoReferencia || null,
      reservaId: this.pagoReservaId,
      hospedajeId: this.pagoHospedajeId,
      observacion: this.pagoObservacion || null
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pago registrado' });
        this.dialogVisible = false;
        this.loadingPago = false;
        this.loadAllPagos();
        this.loadPagos();
      },
      error: (err) => { this.loadingPago = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al registrar pago' }); }
    });
  }

  toggleCierreModal(): void {
    this.showCierreModal = !this.showCierreModal;
    if (this.showCierreModal) {
      this.cierreMontoFisico = this.totalEfectivo;
      this.cierreObservacion = '';
    }
  }

  confirmarCierre(): void {
    if (!this.cajaActual) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'No hay una caja abierta' });
      return;
    }
    this.loading = true;
    this.cajaService.cerrar(this.cajaActual.id, {
      montoFisicoEfectivo: this.cierreMontoFisico || null,
      observacion: this.cierreObservacion || null
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cierre de caja realizado' });
        this.showCierreModal = false;
        this.loading = false;
        this.cajaActual = null;
        this.loadCaja();
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error en cierre de caja' }); }
    });
  }

  abrirCaja(): void {
    this.cajaService.abrir({ montoInicial: 0 }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Caja abierta' });
        this.loadCaja();
      },
      error: (err) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al abrir caja' }); }
    });
  }
}
