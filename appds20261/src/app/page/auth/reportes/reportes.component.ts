import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReporteService } from '../../../observable/reporte.service';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { Subject, merge, auditTime, takeUntil } from 'rxjs';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, DatePickerModule, SelectModule],
  providers: [MessageService],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})

export class ReportesComponent implements OnInit, OnDestroy {
  private reporteService = inject(ReporteService);
  private messageService = inject(MessageService);
  private router = inject(Router);
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

  /* Indicador última actualización */
  lastUpdated: Date = new Date();
  private tickTimer: any = null;

  get updatedAgo(): string {
    const diffSec = Math.max(0, Math.floor((Date.now() - this.lastUpdated.getTime()) / 1000));
    if (diffSec < 60) return diffSec <= 1 ? `hace ${diffSec}s` : `hace ${diffSec}s`;
    const min = Math.floor(diffSec / 60);
    if (min < 60) return min === 1 ? 'hace 1 min' : `hace ${min} min`;
    const hr = Math.floor(min / 60);
    return hr === 1 ? 'hace 1 hr' : `hace ${hr} hr`;
  }

  private stampUpdated(): void {
    this.lastUpdated = new Date();
  }

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

  /* Filtros Ranking */
  rankInicio: Date | null = null;
  rankFin: Date | null = null;
  rankLoading = false;

  /* Filtros Historial Incidencias */
  incFiltroInicio: Date | null = null;
  incFiltroFin: Date | null = null;
  incFiltroTipo = '';
  incFiltroEstado = '';
  incFiltroHabitacion = '';
  incFiltroBusqueda = '';
  incLoading = false;
  incTipoOptions = [
    { label: 'Todas', value: null },
    { label: 'Limpieza', value: 'LIMPIEZA' },
    { label: 'Limpieza Checkout', value: 'LIMPIEZA_CHECKOUT' },
    { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
    { label: 'Otro', value: 'OTRO' }
  ];
  incEstadoOptions = [
    { label: 'Todos', value: null },
    { label: 'En Curso', value: 'EN CURSO' },
    { label: 'Resuelta', value: 'RESUELTA' }
  ];

  resetIncFilters(): void {
    this.incFiltroInicio = null;
    this.incFiltroFin = null;
    this.incFiltroTipo = '';
    this.incFiltroEstado = '';
    this.incFiltroHabitacion = '';
    this.incFiltroBusqueda = '';
    this.loadIncidencias();
  }

  metodoChartData: any = null;
  chartOptions = {
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  /* ---- Tendencia de Ocupación ---- */
  @ViewChild('tendenciaCanvas', { static: false }) tendenciaCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;
  tendenciaInicio: Date | null = null;
  tendenciaFin: Date | null = null;
  tendenciaData: any[] = [];
  trendLoading = false;
  private themeObserver: MutationObserver | null = null;

  get trendDates(): string[] {
    return this.tendenciaData.map(d => d.fecha);
  }
  get trendPercentages(): number[] {
    return this.tendenciaData.map(d => Number(d.porcentajeOcupacion) || 0);
  }
  get trendOccupied(): number[] {
    return this.tendenciaData.map(d => Number(d.ocupadas) || 0);
  }
  get trendAvailable(): number[] {
    return this.tendenciaData.map(d => Number(d.disponibles) || 0);
  }

  get avgOccupancy(): number {
    const pcts = this.trendPercentages;
    return pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  }
  get maxOccupancy(): number {
    return this.trendPercentages.length ? Math.round(Math.max(...this.trendPercentages)) : 0;
  }
  get minOccupancy(): number {
    return this.trendPercentages.length ? Math.round(Math.min(...this.trendPercentages)) : 0;
  }
  get peakDay(): string {
    if (!this.tendenciaData.length) return '—';
    const max = Math.max(...this.trendPercentages);
    const idx = this.trendPercentages.indexOf(max);
    return this.fmtDateShort(this.tendenciaData[idx].fecha);
  }
  get lowestDay(): string {
    if (!this.tendenciaData.length) return '—';
    const min = Math.min(...this.trendPercentages);
    const idx = this.trendPercentages.indexOf(min);
    return this.fmtDateShort(this.tendenciaData[idx].fecha);
  }
  get avgAvailable(): number {
    const av = this.trendAvailable;
    return av.length ? Math.round(av.reduce((a, b) => a + b, 0) / av.length) : 0;
  }
  get totalRooms(): number {
    return this.tendenciaData.length ? (this.tendenciaData[0].totalHabitaciones || 0) : 0;
  }
  get totalDays(): number {
    return this.tendenciaData.length;
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseDateStr(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y || 2000, (m || 1) - 1, d || 1);
  }

  private fmtDateShort(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
  }

  private fmtDateFull(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${parseInt(d)} de ${months[parseInt(m) - 1]}`;
  }

  trendChange(idx: number): 'up' | 'down' | 'same' {
    if (idx <= 0) return 'same';
    const prev = this.trendPercentages[idx - 1];
    const curr = this.trendPercentages[idx];
    if (curr > prev) return 'up';
    if (curr < prev) return 'down';
    return 'same';
  }

  ngOnInit(): void {
    const hoy = new Date();
    const today = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const firstDay = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // Leer fecha operativa enviada desde el Dashboard (Admin)
    const nav = this.router.getCurrentNavigation();
    const navState = nav?.extras?.state as { fecha?: string; seccion?: string } | undefined;
    const histState = window.history.state as { fecha?: string; seccion?: string } | undefined;
    const fechaCtx = navState?.fecha || histState?.fecha;
    const seccionCtx = navState?.seccion || histState?.seccion;
    const fechaOp = fechaCtx ? this.parseDateStr(fechaCtx) : null;
    const base = fechaOp ?? today;
    const baseStart = fechaOp ? new Date(base) : firstDay;

    this.ingresoInicio = baseStart;
    this.ingresoFin = new Date(base);
    this.metodoInicio = this.toDateStr(baseStart);
    this.metodoFin = this.toDateStr(base);
    this.ocupacionFecha = new Date(base);
    this.tendenciaInicio = new Date(today.getFullYear(), today.getMonth(), 1);
    this.tendenciaFin = today;
    this.noConcretadasInicio = new Date(baseStart);
    this.noConcretadasFin = new Date(base);
    this.loadIngresos();
    this.loadIngresosMetodo();
    this.loadOcupacion();
    this.loadNoConcretadas();
    this.loadIncidencias();
    this.loadRanking();
    this.loadTendencia();
    if (seccionCtx === 'tendencia' || seccionCtx === 'impuestos') {
      setTimeout(() => this.scrollToSection(seccionCtx as 'tendencia' | 'impuestos'), 350);
    }
    merge(
      this.estadoActualizacion.on('PAGO_CAMBIO'),
      this.estadoActualizacion.on('HOSPEDAJE_CAMBIO'),
      this.estadoActualizacion.on('RESERVA_CAMBIO'),
      this.estadoActualizacion.on('HABITACION_CAMBIO'),
      this.estadoActualizacion.on('CONSUMO_CAMBIO'),
      this.estadoActualizacion.on('INCIDENCIA_CAMBIO')
    ).pipe(auditTime(0), takeUntil(this.destroy$)).subscribe(() => this.recargar());

    this.tickTimer = setInterval(() => this.cdr.detectChanges(), 1000);
  }

  ngAfterViewInit(): void {
    this.themeObserver = new MutationObserver(() => {
      if (this.chart && this.tendenciaData.length) this.initChart();
    });
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  private scrollToSection(id: 'tendencia' | 'impuestos'): void {
    const el = document.getElementById(id === 'tendencia' ? 'rep-tendencia' : 'rep-impuestos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('rep-section-flash');
      setTimeout(() => el.classList.remove('rep-section-flash'), 1600);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
    if (this.chart) { this.chart.destroy(); this.chart = null; }
    if (this.themeObserver) this.themeObserver.disconnect();
  }

  private recargar(): void {
    this.stampUpdated();
    this.loadIngresos();
    this.loadIngresosMetodo();
    this.loadOcupacion();
    this.loadNoConcretadas();
    this.loadIncidencias();
    this.loadRanking();
    this.loadTendencia();
  }

  loadTendencia(): void {
    if (!this.tendenciaInicio || !this.tendenciaFin) return;
    this.trendLoading = true;
    this.reporteService.tendenciaOcupacion(
      this.toDateStr(this.tendenciaInicio),
      this.toDateStr(this.tendenciaFin)
    ).subscribe({
      next: (res) => {
        this.tendenciaData = (res.data || []).map((item: any) => ({
          fecha: item.fecha,
          ocupadas: item.habitacionesOcupadas,
          disponibles: item.habitacionesDisponibles,
          totalHabitaciones: item.totalHabitaciones,
          porcentajeOcupacion: item.porcentaje
        }));
        this.trendLoading = false;
        this.cdr.detectChanges();
        this.appRef.tick();
        this.initChart();
      },
      error: () => {
        this.trendLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getCSSVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private colorWithAlpha(varName: string, alpha: number): string {
    const c = this.getCSSVar(varName);
    if (c.startsWith('#')) {
      const r = parseInt(c.slice(1, 3), 16);
      const g = parseInt(c.slice(3, 5), 16);
      const b = parseInt(c.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    if (c.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
    return c;
  }

  private initChart(): void {
    if (!this.tendenciaCanvas?.nativeElement || !this.tendenciaData.length) return;
    const ctx = this.tendenciaCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.chart) { this.chart.destroy(); this.chart = null; }

    const lineColor = this.getCSSVar('--clr-secondary') || '#C9A45C';
    const gridColor = this.getCSSVar('--clr-outline-variant') || '#D5D0C8';
    const textColor = this.getCSSVar('--clr-on-surface-variant') || '#6B6B6B';

    const labels = this.tendenciaData.map(d => this.fmtDateShort(d.fecha));
    const pcts = this.trendPercentages;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Ocupación %',
          data: pcts,
          borderColor: lineColor,
          backgroundColor: (context) => {
            const { ctx: c, chartArea } = context.chart;
            if (!chartArea) return 'transparent';
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, this.colorWithAlpha('--clr-secondary', 0.25));
            g.addColorStop(1, 'transparent');
            return g;
          },
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: pcts.map((_, i) => {
            const chg = this.trendChange(i);
            if (chg === 'up') return '#57B65E';
            if (chg === 'down') return '#D9534F';
            return lineColor;
          }),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHitRadius: 12,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeInOutQuart'
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: this.getCSSVar('--clr-surface-container-lowest') || '#ffffff',
            titleColor: this.getCSSVar('--clr-on-surface') || '#232323',
            bodyColor: this.getCSSVar('--clr-on-surface-variant') || '#6B6B6B',
            borderColor: gridColor,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            titleFont: { weight: 'bold', size: 13 },
            bodyFont: { size: 12 },
            callbacks: {
              title: (items) => {
                const d = this.tendenciaData[items[0].dataIndex];
                return d ? this.fmtDateFull(d.fecha) : '';
              },
              label: () => '',
              afterBody: (items) => {
                const d = this.tendenciaData[items[0].dataIndex];
                if (!d) return [];
                const chg = this.trendChange(items[0].dataIndex);
                const arrow = chg === 'up' ? '↑' : chg === 'down' ? '↓' : '→';
                const arrowColor = chg === 'up' ? '#57B65E' : chg === 'down' ? '#D9534F' : '#999';
                return [
                  `Habitaciones ocupadas: ${d.ocupadas}`,
                  `Disponibles: ${d.disponibles}`,
                  `Ocupación: ${d.porcentajeOcupacion}%`,
                ];
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColor,
              font: { size: 10, weight: 'bold' },
              maxTicksLimit: 8,
              maxRotation: 0
            },
            grid: { display: false }
          },
          y: {
            min: 0,
            max: 100,
            ticks: {
              color: textColor,
              font: { size: 10 },
              stepSize: 25,
              callback: (value) => `${value}%`,
              maxTicksLimit: 5
            },
            border: { display: false },
            grid: {
              color: gridColor,
              lineWidth: 1
            }
          }
        }
      }
    });
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
    this.incLoading = true;
    this.reporteService.historialIncidencias({
      inicio: this.incFiltroInicio ? this.toDateStr(this.incFiltroInicio) : null,
      fin: this.incFiltroFin ? this.toDateStr(this.incFiltroFin) : null,
      tipo: this.incFiltroTipo || null,
      estado: this.incFiltroEstado || null,
      habitacion: this.incFiltroHabitacion || null,
      search: this.incFiltroBusqueda || null
    }).subscribe({
      next: (res) => { this.historialIncidencias = res.data || []; this.incLoading = false; this.cdr.detectChanges(); this.appRef.tick(); },
      error: () => { this.incLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar incidencias' }); }
    });
  }

  loadRanking(): void {
    this.rankLoading = true;
    this.reporteService.rankingHabitaciones(
      this.rankInicio ? this.toDateStr(this.rankInicio) : null,
      this.rankFin ? this.toDateStr(this.rankFin) : null
    ).subscribe({
      next: (res) => { this.ranking = res.data || []; this.rankLoading = false; this.cdr.detectChanges(); this.appRef.tick(); },
      error: () => { this.rankLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ranking' }); }
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
