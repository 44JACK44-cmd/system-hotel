import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../../observable/reporte.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})

export class ReportesComponent implements OnInit {
  private reporteService = inject(ReporteService);
  private messageService = inject(MessageService);

  loading = false;
  ingresos: any = null;
  ingresosMetodo: any = null;
  ocupacion: any = null;
  noConcretadas: any = null;
  historialIncidencias: any[] = [];
  ranking: any[] = [];

  ingresoInicio = '';
  ingresoFin = '';
  metodoInicio = '';
  metodoFin = '';
  ocupacionFecha = '';
  noConcretadasInicio = '';
  noConcretadasFin = '';

  metodoChartData: any = null;
  chartOptions = {
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.ingresoInicio = firstDay;
    this.ingresoFin = today;
    this.metodoInicio = firstDay;
    this.metodoFin = today;
    this.ocupacionFecha = today;
    this.noConcretadasInicio = firstDay;
    this.noConcretadasFin = today;
    this.loadIngresos();
    this.loadIngresosMetodo();
    this.loadOcupacion();
    this.loadNoConcretadas();
  }

  loadIngresos(): void {
    if (!this.ingresoInicio || !this.ingresoFin) return;
    this.loading = true;
    this.reporteService.ingresos(this.ingresoInicio, this.ingresoFin).subscribe({
      next: (res) => { this.ingresos = res.data; this.loading = false; },
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
      },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar metodo' }); }
    });
  }

  loadOcupacion(): void {
    if (!this.ocupacionFecha) return;
    this.loading = true;
    this.reporteService.ocupacion(this.ocupacionFecha).subscribe({
      next: (res) => { this.ocupacion = res.data; this.loading = false; },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ocupacion' }); }
    });
  }

  loadNoConcretadas(): void {
    if (!this.noConcretadasInicio || !this.noConcretadasFin) return;
    this.loading = true;
    this.reporteService.reservasNoConcretadas(this.noConcretadasInicio, this.noConcretadasFin).subscribe({
      next: (res) => { this.noConcretadas = res.data; this.loading = false; },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar no concretadas' }); }
    });
  }

  loadIncidencias(): void {
    this.loading = true;
    this.reporteService.historialIncidencias().subscribe({
      next: (res) => { this.historialIncidencias = res.data || []; this.loading = false; },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar incidencias' }); }
    });
  }

  loadRanking(): void {
    this.loading = true;
    this.reporteService.rankingHabitaciones().subscribe({
      next: (res) => { this.ranking = res.data || []; this.loading = false; },
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
}
