import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../../../observable/pago.service';
import { EgresoService } from '../../../observable/egreso.service';
import { CajaService } from '../../../observable/caja.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {
  private pagoService = inject(PagoService);
  private egresoService = inject(EgresoService);
  private cajaService = inject(CajaService);
  private messageService = inject(MessageService);

  Math = Math;
  pagos: any[] = [];
  filteredPagos: any[] = [];
  egresos: any[] = [];
  loading = false;
  dialogVisible = false;
  searchTerm = '';

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
    this.loadPagos();
    this.loadEgresos();
    this.loadCaja();
  }

  get totalEfectivo(): number {
    return this.pagos.filter(p => p.metodo === 'EFECTIVO').reduce((s, p) => s + (p.monto || 0), 0);
  }

  get totalYape(): number {
    return this.pagos.filter(p => p.metodo === 'YAPE').reduce((s, p) => s + (p.monto || 0), 0);
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

  loadPagos(): void {
    this.loading = true;
    this.pagoService.listarTodos().subscribe({
      next: res => { this.pagos = res.data || []; this.filteredPagos = [...this.pagos]; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadEgresos(): void {
    this.egresoService.listarTodos().subscribe({
      next: res => this.egresos = res.data || []
    });
  }

  loadCaja(): void {
    this.cajaService.obtenerActual().subscribe({
      next: res => this.cajaActual = res.data
    });
  }

  filter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) { this.filteredPagos = [...this.pagos]; return; }
    this.filteredPagos = this.pagos.filter(p =>
      (p.id?.toString() || '').includes(term) ||
      (p.tipo || '').toLowerCase().includes(term) ||
      (p.metodo || '').toLowerCase().includes(term) ||
      (p.referencia || '').toLowerCase().includes(term) ||
      (p.usuarioNombre || '').toLowerCase().includes(term)
    );
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
        this.loadEgresos();
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
