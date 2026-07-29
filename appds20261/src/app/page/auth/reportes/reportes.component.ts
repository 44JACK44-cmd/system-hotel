import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../../observable/reporte.service';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { Subject, merge, auditTime, takeUntil } from 'rxjs';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, DatePickerModule],
  providers: [MessageService],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})

export class ReportesComponent implements OnInit, OnDestroy {
  private reporteService = inject(ReporteService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private estadoActualizacion = inject(EstadoActualizacionService);
  private destroy$ = new Subject<void>();

  loading = false;
  ingresos: any = null;
  ingresosMetodo: any = null;
  ocupacion: any = null;
  noConcretadas: any = null;
  historialIncidencias: any[] = [];
  ranking: any[] = [];

  /* Sort - Historial */
  histSortField = '';
  histSortDir: 'asc' | 'desc' = 'asc';

  get sortedHistorial(): any[] {
    let list = this.historialIncidencias;
    if (this.histSortField) {
      list = [...list].sort((a, b) => {
        const va = (a[this.histSortField] || '').toString().toLowerCase();
        const vb = (b[this.histSortField] || '').toString().toLowerCase();
        return this.histSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return list;
  }

  toggleSortHist(field: string): void {
    if (this.histSortField === field) { this.histSortDir = this.histSortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.histSortField = field; this.histSortDir = 'asc'; }
  }

  /* Sort - Ranking */
  rankSortField = '';
  rankSortDir: 'asc' | 'desc' = 'asc';

  get sortedRanking(): any[] {
    let list = this.ranking;
    if (this.rankSortField) {
      list = [...list].sort((a, b) => {
        let va = (a[this.rankSortField] || '').toString().toLowerCase();
        let vb = (b[this.rankSortField] || '').toString().toLowerCase();
        if (this.rankSortField === 'vecesReservada' || this.rankSortField === 'ingresoGenerado') {
          return this.rankSortDir === 'asc' ? Number(a[this.rankSortField] || 0) - Number(b[this.rankSortField] || 0) : Number(b[this.rankSortField] || 0) - Number(a[this.rankSortField] || 0);
        }
        return this.rankSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return list;
  }

  toggleSortRank(field: string): void {
    if (this.rankSortField === field) { this.rankSortDir = this.rankSortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.rankSortField = field; this.rankSortDir = 'asc'; }
  }

  ingresoInicio: Date | null = null;
  ingresoFin: Date | null = null;
  metodoInicio = '';
  metodoFin = '';
  ocupacionFecha: Date | null = null;
  noConcretadasInicio: Date | null = null;
  noConcretadasFin: Date | null = null;

  metodoChartData: any = null;
  chartOptions = {
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  ngOnInit(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.ingresoInicio = firstDay;
    this.ingresoFin = today;
    this.metodoInicio = this.toDateStr(firstDay);
    this.metodoFin = this.toDateStr(today);
    this.ocupacionFecha = today;
    this.noConcretadasInicio = firstDay;
    this.noConcretadasFin = today;
    this.loadIngresos();
    this.loadIngresosMetodo();
    this.loadOcupacion();
    this.loadNoConcretadas();
    this.loadIncidencias();
    this.loadRanking();
    merge(
      this.estadoActualizacion.on('PAGO_CAMBIO'),
      this.estadoActualizacion.on('HOSPEDAJE_CAMBIO'),
      this.estadoActualizacion.on('RESERVA_CAMBIO'),
      this.estadoActualizacion.on('HABITACION_CAMBIO'),
      this.estadoActualizacion.on('CONSUMO_CAMBIO'),
      this.estadoActualizacion.on('INCIDENCIA_CAMBIO')
    ).pipe(auditTime(0), takeUntil(this.destroy$)).subscribe(() => this.recargar());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private recargar(): void {
    this.loadIngresos();
    this.loadIngresosMetodo();
    this.loadOcupacion();
    this.loadNoConcretadas();
    this.loadIncidencias();
    this.loadRanking();
  }

  loadIngresos(): void {
    if (!this.ingresoInicio || !this.ingresoFin) return;
    this.loading = true;
    this.reporteService.ingresos(this.toDateStr(this.ingresoInicio), this.toDateStr(this.ingresoFin)).subscribe({
      next: (res) => { this.ingresos = res.data; this.loading = false; this.cdr.detectChanges(); this.appRef.tick(); },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ingresos' }); }
    });
  }

  loadIngresosMetodo(): void {
    if (!this.metodoInicio || !this.metodoFin) return;
    this.loading = true;
    this.reporteService.ingresosPorMetodo(this.metodoInicio, this.metodoFin).subscribe({
      next: (res) => {
        this.ingresosMetodo = res.data;
        this.metodoChartData = {
          labels: ['Yape', 'Efectivo'],
          datasets: [{
            data: [res.data?.yape || 0, res.data?.efectivo || 0],
            backgroundColor: ['#6366f1', '#22c55e']
          }]
        };
        this.loading = false;
        this.cdr.detectChanges();
        this.appRef.tick();
      },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar metodo' }); }
    });
  }

  loadOcupacion(): void {
    if (!this.ocupacionFecha) return;
    this.loading = true;
    this.reporteService.ocupacion(this.toDateStr(this.ocupacionFecha)).subscribe({
      next: (res) => { this.ocupacion = res.data; this.loading = false; this.cdr.detectChanges(); this.appRef.tick(); },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ocupacion' }); }
    });
  }

  loadNoConcretadas(): void {
    if (!this.noConcretadasInicio || !this.noConcretadasFin) return;
    this.loading = true;
    this.reporteService.reservasNoConcretadas(this.toDateStr(this.noConcretadasInicio), this.toDateStr(this.noConcretadasFin)).subscribe({
      next: (res) => { this.noConcretadas = res.data; this.loading = false; this.cdr.detectChanges(); this.appRef.tick(); },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar no concretadas' }); }
    });
  }

  loadIncidencias(): void {
    this.loading = true;
    this.reporteService.historialIncidencias().subscribe({
      next: (res) => { this.historialIncidencias = res.data || []; this.loading = false; this.cdr.detectChanges(); this.appRef.tick(); },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar incidencias' }); }
    });
  }

  loadRanking(): void {
    this.loading = true;
    this.reporteService.rankingHabitaciones().subscribe({
      next: (res) => { this.ranking = res.data || []; this.loading = false; this.cdr.detectChanges(); this.appRef.tick(); },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ranking' }); }
    });
  }

  exportCSV(data: any[], filename: string, columns: string[]): void {
    if (!data || data.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin datos', detail: 'No hay datos para exportar' });
      return;
    }
    const BOM = '\uFEFF';
    const header = columns.join(',');
    const rows = data.map(row =>
      columns.map(col => {
        const val = this.getNestedValue(row, col);
        const str = val != null ? String(val).replace(/"/g, '""') : '';
        return `"${str}"`;
      }).join(',')
    ).join('\n');
    const blob = new Blob([BOM + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
  }

  private formatLabel(key: string): string {
    const map: Record<string, string> = {
      total: 'Total', totalAdelantos: 'Adelantos', totalSaldos: 'Saldos',
      totalExtensiones: 'Extensiones', fechaInicio: 'Inicio', fechaFin: 'Fin',
      nombre: 'Nombre', documento: 'Documento', telefono: 'Teléfono',
      email: 'Email', habitacion: 'Habitación', tipo: 'Tipo',
      motivo: 'Motivo', duracionHoras: 'Duración (h)', estado: 'Estado',
      numero: 'Número', vecesReservada: 'Veces Reservada',
      ingresoGenerado: 'Ingreso Generado', cliente: 'Cliente'
    };
    return map[key] || key;
  }

  exportPDF(data: any[], title: string, columns: string[]): void {
    if (!data || data.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin datos', detail: 'No hay datos para exportar' });
      return;
    }
    const rows = data.map(row =>
      '<tr>' + columns.map(col => `<td>${this.getNestedValue(row, col) ?? ''}</td>`).join('') + '</tr>'
    ).join('');
    const headers = columns.map(c => `<th>${this.formatLabel(c)}</th>`).join('');

    const win = window.open('', '_blank');
    if (!win) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Permita ventanas emergentes para exportar PDF' });
      return;
    }
    win.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h2 { margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 700; }
        tr:nth-child(even) { background: #fafafa; }
        @media print { body { padding: 10mm; } }
      </style></head><body>
      <h2>${title}</h2>
      <table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
      <p style="margin-top:16px;font-size:10px;color:#999;">Generado el ${new Date().toLocaleString()}</p>
      <script>window.onload = function() { window.print(); window.close(); };</script>
      </body></html>
    `);
    win.document.close();
  }
}
