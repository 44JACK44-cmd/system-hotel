import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../observable/auth.service';
import { ReporteService } from '../../../observable/reporte.service';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, merge, auditTime, takeUntil } from 'rxjs';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePickerModule, TooltipModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private reporteService = inject(ReporteService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private estadoActualizacion = inject(EstadoActualizacionService);
  private destroy$ = new Subject<void>();

  mesActual = '';
  loading = false;
  ingresos: any = null;
  ocupacion: any = null;

  fechaOperativa: Date = new Date();
  calendarioAbierto = false;
  private cache = new Map<string, { ingresos: any; ocupacion: any }>();

  get fechaStr(): string {
    return this.toDateStr(this.fechaOperativa);
  }

  get modoOperativo(): 'hoy' | 'historico' | 'proyeccion' {
    const hoy = new Date();
    const f = this.stripTime(this.fechaOperativa);
    const h = this.stripTime(hoy);
    if (f.getTime() === h.getTime()) return 'hoy';
    return f < h ? 'historico' : 'proyeccion';
  }

  get indicadorOperando(): string {
    const m = this.modoOperativo;
    if (m === 'hoy') return 'Hoy';
    return m === 'historico' ? 'Hist\u00f3rico' : 'Proyecci\u00f3n';
  }

  fechaLabelOperativa = '';

  navItems = [
    { label: 'Habitaciones', icon: 'bed',               route: '/admin/habitaciones'    },
    { label: 'Usuarios',     icon: 'manage_accounts',   route: '/admin/usuarios'        },
    { label: 'Reportes',     icon: 'bar_chart',         route: '/admin/reportes'        },
    { label: 'Clientes',     icon: 'group',             route: '/recepcion/clientes'    },
    { label: 'Incidencias',  icon: 'cleaning_services', route: '/recepcion/incidencias' },
    { label: 'Reservas',     icon: 'calendar_month',    route: '/recepcion/reservas'    },
    { label: 'Pagos',        icon: 'payments',          route: '/recepcion/pagos'       },
    { label: 'Hospedajes',   icon: 'hotel',             route: '/recepcion/hospedajes'  },
    { label: 'Recepción',    icon: 'concierge',         route: '/recepcion/dashboard'   },
  ];

  ngOnInit(): void {
    this.fechaLabelOperativa = this.formatFechaLarga(this.fechaOperativa);
    this.actualizarEtiquetaMes();
    this.cargarReportes();
    merge(
      this.estadoActualizacion.on('PAGO_CAMBIO'), this.estadoActualizacion.on('HOSPEDAJE_CAMBIO'),
      this.estadoActualizacion.on('RESERVA_CAMBIO'), this.estadoActualizacion.on('HABITACION_CAMBIO'),
      this.estadoActualizacion.on('CONSUMO_CAMBIO')
    ).pipe(auditTime(0), takeUntil(this.destroy$)).subscribe(() => this.cargarReportes());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  setFechaHoy() { this.seleccionarFecha(new Date()); }
  setFechaAyer() { const d = new Date(); d.setDate(d.getDate() - 1); this.seleccionarFecha(d); }
  setFechaManana() { const d = new Date(); d.setDate(d.getDate() + 1); this.seleccionarFecha(d); }

  exportarReporte(): void {
    this.router.navigate(['/admin/reportes'], { state: { fecha: this.fechaStr } });
  }

  /* --- REPORTES INTEGRALES --- */
  irFacturacion(): void {
    this.router.navigate(['/admin/reportes'], { state: { fecha: this.fechaStr } });
  }

  irLibroImpuestos(): void {
    // No existe módulo tributario separado: navega a Reportes con foco en sección fiscal
    this.router.navigate(['/admin/reportes'], { state: { fecha: this.fechaStr, seccion: 'impuestos' } });
  }

  irTendencias(): void {
    this.router.navigate(['/admin/reportes'], { state: { fecha: this.fechaStr, seccion: 'tendencia' } });
  }

  irRegistros(): void {
    // Bitácora / auditoría -> Actividad (historial del sistema)
    this.router.navigate(['/actividad']);
  }

  irAjustes(): void {
    this.router.navigate(['/admin/configuracion']);
  }

  seleccionarFecha(f: Date): void {
    if (!f) return;
    this.fechaOperativa = this.stripTime(new Date(f));
    this.calendarioAbierto = false;
    this.fechaLabelOperativa = this.formatFechaLarga(this.fechaOperativa);
    this.actualizarEtiquetaMes();
    this.cargarReportes();
  }

  private stripTime(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatFechaLarga(d: Date): string {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Setiembre','Octubre','Noviembre','Diciembre'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  private actualizarEtiquetaMes(): void {
    const meses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SETIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    this.mesActual = `${meses[this.fechaOperativa.getMonth()]} ${this.fechaOperativa.getFullYear()}`;
  }

  private cargarReportes(): void {
    this.loading = true;
    const today = this.fechaStr;
    const cached = this.cache.get(today);
    if (cached) {
      this.ingresos = cached.ingresos;
      this.ocupacion = cached.ocupacion;
      this.loading = false;
      this.cdr.detectChanges();
      this.appRef.tick();
      return;
    }
    this.reporteService.ingresos(today, today).subscribe({
      next: res => { this.ingresos = res.data; },
      error: () => {}
    });
    this.reporteService.ocupacion(today).subscribe({
      next: res => {
        this.ocupacion = res.data;
        this.cache.set(today, { ingresos: this.ingresos, ocupacion: res.data });
        this.loading = false;
        this.cdr.detectChanges();
        this.appRef.tick();
      },
      error: () => this.loading = false
    });
  }
}
