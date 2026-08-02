import { Component, HostListener, inject, ApplicationRef, ChangeDetectorRef, NgZone, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { HabitacionService } from '../../../observable/habitacion.service';
import { ReservaService } from '../../../observable/reserva.service';
import { HospedajeService } from '../../../observable/hospedaje.service';
import { CajaService } from '../../../observable/caja.service';
import { ReporteService } from '../../../observable/reporte.service';
import { AuthService } from '../../../observable/auth.service';
import { AlertaService } from '../../../services/alerta.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { NuevaReservaComponent } from '../../../components/nueva-reserva/nueva-reserva.component';
import { CheckInComponent } from '../../../components/checkin/checkin.component';
import { CheckOutComponent } from '../../../components/checkout/checkout.component';
import { PagosModalComponent } from '../../../components/pagos-modal/pagos-modal.component';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, FormsModule, DatePickerModule, TooltipModule, TableModule, TagModule, CardModule, ButtonModule, SkeletonModule, NuevaReservaComponent, CheckInComponent, CheckOutComponent, PagosModalComponent],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit, OnDestroy {
  private router = inject(Router);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private habitacionService = inject(HabitacionService);
  private reservaService = inject(ReservaService);
  private hospedajeService = inject(HospedajeService);
  private cajaService = inject(CajaService);
  private reporteService = inject(ReporteService);
  private authService = inject(AuthService);
  private alertaService = inject(AlertaService);
  private estadoActualizacion = inject(EstadoActualizacionService);

  private destroy$ = new Subject<void>();

  showNuevaReserva = false;
  showCheckIn = false;
  showCheckOut = false;
  showPagos = false;
  selectedCheckOutId: number | null = null;
  loading = false;
  shortcutsEnabled = true;

  // Operación por fecha
  fechaOperativa: Date = new Date();
  calendarioAbierto = false;
  fechaLabelOperativa = '';
  private cache = new Map<string, any>();

  get fechaStr(): string { return this.toDateStr(this.fechaOperativa); }

  get esHoy(): boolean {
    return this.stripTime(this.fechaOperativa).getTime() === this.hoyInicio().getTime();
  }

  get modoOperativo(): 'hoy' | 'historico' | 'proyeccion' {
    const f = this.stripTime(this.fechaOperativa).getTime();
    const h = this.hoyInicio().getTime();
    if (f === h) return 'hoy';
    return f < h ? 'historico' : 'proyeccion';
  }

  get indicadorOperando(): string {
    if (this.modoOperativo === 'hoy') return 'Hoy';
    return this.modoOperativo === 'historico' ? 'Hist\u00f3rico' : 'Proyecci\u00f3n';
  }

  private hoyInicio(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
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

  setFechaHoy() { this.seleccionarFecha(new Date()); }
  setFechaAyer() { const d = new Date(); d.setDate(d.getDate() - 1); this.seleccionarFecha(d); }
  setFechaManana() { const d = new Date(); d.setDate(d.getDate() + 1); this.seleccionarFecha(d); }

  seleccionarFecha(f: Date): void {
    if (!f) return;
    const nueva = this.stripTime(new Date(f));
    if (nueva.getTime() === this.stripTime(this.fechaOperativa).getTime()) {
      this.calendarioAbierto = false;
      return;
    }
    this.fechaOperativa = nueva;
    this.fechaLabelOperativa = this.formatFechaLarga(this.fechaOperativa);
    this.calendarioAbierto = false;
    this.cargarDatos();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (!this.shortcutsEnabled) return;
    const ctrl = event.ctrlKey || event.metaKey;
    if (ctrl && event.key === 'i') {
      event.preventDefault();
      this.showCheckIn = true;
    } else if (ctrl && event.key === 'o') {
      event.preventDefault();
      this.showCheckOut = true;
      this.selectedCheckOutId = null;
    } else if (ctrl && event.key === 'r') {
      event.preventDefault();
      this.showNuevaReserva = true;
    }
  }

  habitacionesCount = { total: 0, disponibles: 0, ocupadas: 0, limpieza: 0, mantenimiento: 0 };
  cajaAbierta = false;
  cajaInfo: any = null;
  ingresosHoy = 0;
  ingresosAdelantosFecha = 0;
  deudasPendientesCount: number = 0;
  alertResumen = { urgentes: 0, criticas: 0, importantes: 0, avisos: 0, informativas: 0, exitos: 0, total: 0, noLeidas: 0, pendientes: 0, completadasHoy: 0 };
  deudasMontoTotal: number = 0;

  pisos: { numero: number; habitaciones: any[] }[] = [];
  reservasDelDia: any[] = [];
  hospedajesActivos: any[] = [];
  private huespedMap = new Map<string, string>();

  ngOnInit(): void {
    this.fechaLabelOperativa = this.formatFechaLarga(this.fechaOperativa);
    this.cargarDatos();
    this.cargarAlertas();
    const refreshAll = () => { this.cargarDatos(); this.cargarAlertas(); };
    this.estadoActualizacion.on('HABITACION_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => refreshAll());
    this.estadoActualizacion.on('HOSPEDAJE_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => refreshAll());
    this.estadoActualizacion.on('RESERVA_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => refreshAll());
    this.estadoActualizacion.on('PAGO_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => refreshAll());
    this.estadoActualizacion.on('NOTIFICACION_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarAlertas());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByPiso(_index: number, piso: any): number { return piso.numero; }
  trackByHab(_index: number, hab: any): number { return hab.id; }
  trackByReserva(_index: number, r: any): any { return r.id; }
  trackByHospedaje(_index: number, h: any): any { return h.id; }

  getHuespedNombre(hab: any): string {
    return this.huespedMap.get(hab.numero) || '---';
  }

  irALimpieza(): void {
    this.router.navigate(['/recepcion/incidencias']);
  }

  irAIngresoDirecto(): void {
    this.router.navigate(['/recepcion/hospedajes'], { state: { accion: 'directo' } });
  }

  private verificarNotificaciones(): void {
  }

  cargarAlertas(): void {
    this.alertaService.getResumen().subscribe({
      next: r => this.alertResumen = r
    });
  }

  abrirAlertas(filtro: string): void {
    this.alertaService.activeFilter.set(filtro);
  }

  getRoomStatusColor(estado: string): string {
    const map: Record<string, string> = {
      DISPONIBLE: 'var(--clr-status-available)',
      OCUPADA: 'var(--clr-status-occupied)',
      SUCIA: 'var(--clr-status-dirty)',
      LIMPIEZA: 'var(--clr-status-dirty)',
      MANTENIMIENTO: 'var(--clr-status-maintenance)'
    };
    return map[estado] || 'var(--clr-on-surface-variant)';
  }

  getReservaStatusClass(estado: string): string {
    const map: Record<string, string> = {
      CONFIRMADA: 'badge-confirmed',
      PENDIENTE: 'badge-pending',
      CANCELADA: 'badge-cancelled',
      NO_SHOW: 'badge-error',
      CONCRETADA: 'badge-success'
    };
    return map[estado] || 'badge-info';
  }

  cargarDatos(): void {
    if (this.esHoy) {
      this.cargarDatosHoy();
    } else {
      this.cargarDatosFecha(this.fechaStr);
    }
  }

  private cargarDatosHoy(): void {
    this.loading = true;

    const obsHabitaciones = this.habitacionService.listarActivas().pipe(
      catchError(() => of({ data: [] }))
    );
    const obsReservas = this.reservaService.listarDelDia().pipe(
      catchError(() => of({ data: [] }))
    );
    const obsHospedajes = this.hospedajeService.listarActivos().pipe(
      catchError(() => of({ data: [] }))
    );

    const cached = this.cache.get(this.fechaStr);
    if (cached) {
      this.aplicarCache(cached);
      this.cargarAuxiliares();
      return;
    }

    forkJoin({
      habitaciones: obsHabitaciones,
      reservas: obsReservas,
      hospedajes: obsHospedajes
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ habitaciones, reservas, hospedajes }) => {
        const rooms = (habitaciones as any).data || [];
        const hospedajesList = (hospedajes as any).data || [];

        this.huespedMap.clear();
        hospedajesList.forEach((h: any) => {
          this.huespedMap.set(h.habitacionNumero, h.clienteNombre);
        });

        const pisoMap = new Map<number, any[]>();
        rooms.forEach((r: any) => {
          const piso = r.piso || r.numero?.toString().charAt(0) || 1;
          const pisoNum = parseInt(piso, 10);
          if (!pisoMap.has(pisoNum)) pisoMap.set(pisoNum, []);
          pisoMap.get(pisoNum)!.push(r);
        });
        this.pisos = Array.from(pisoMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([numero, habitaciones]) => ({ numero, habitaciones }));
        this.reservasDelDia = (reservas as any).data || [];
        this.hospedajesActivos = hospedajesList;

        this.habitacionesCount = {
          total: rooms.length,
          disponibles: rooms.filter((r: any) => r.estado === 'DISPONIBLE').length,
          ocupadas: rooms.filter((r: any) => r.estado === 'OCUPADA').length,
          limpieza: rooms.filter((r: any) => r.estado === 'LIMPIEZA').length,
          mantenimiento: rooms.filter((r: any) => r.estado === 'MANTENIMIENTO').length
        };

        this.cache.set(this.fechaStr, {
          pisos: this.pisos, reservasDelDia: this.reservasDelDia,
          hospedajesActivos: this.hospedajesActivos, habitacionesCount: this.habitacionesCount
        });

        this.loading = false;

        this.cdr.detectChanges();

        this.appRef.tick();

        this.cargarAuxiliares();
      },
      error: () => {
        this.loading = false;
        this.appRef.tick();
      }
    });
  }

  private aplicarResumenOcupacion(ocupacion: any): void {
    if (!ocupacion) return;
    const total = ocupacion.totalHabitaciones ?? this.habitacionesCount.total;
    const disponibles = ocupacion.disponibles ?? 0;
    const ocupadas = ocupacion.ocupadas ?? 0;
    this.habitacionesCount = {
      total: total || this.habitacionesCount.total,
      disponibles,
      ocupadas,
      limpieza: ocupacion.limpieza ?? 0,
      mantenimiento: ocupacion.mantenimiento ?? 0
    };
  }

  private cargarDatosFecha(fecha: string): void {
    const cached = this.cache.get(fecha);
    if (cached) {
      this.aplicarResumenOcupacion(cached.ocupacion);
      this.reservasDelDia = cached.reservas || [];
      this.hospedajesActivos = cached.hospedajes || [];
      this.ingresosHoy = cached.ingresos || 0;
      this.aplicarResumenOcupacion(cached.ocupacion);
      this.cdr.detectChanges();
      this.appRef.tick();
      this.cargarAuxiliares();
      return;
    }

    this.loading = true;
    this.reporteService.ocupacion(fecha).pipe(catchError(() => of({ data: null }))).subscribe({
      next: (res) => {
        this.aplicarResumenOcupacion(res.data);
        if (res.data) this.guardarCache(fecha, 'ocupacion', res.data);
        this.loading = false;
        this.cdr.detectChanges();
        this.appRef.tick();
      },
      error: () => this.loading = false
    });

    this.reporteService.ingresos(fecha, fecha).pipe(catchError(() => of({ data: { total: 0 } }))).subscribe({
      next: (res) => {
        this.ingresosHoy = res.data?.total || 0;
        this.ingresosAdelantosFecha = res.data?.totalAdelantos || 0;
        if (res.data) this.guardarCache(fecha, 'ingresos', res.data?.total || 0);
        this.cdr.detectChanges();
      }
    });

    // Reservas proyectadas para la fecha (ingresos/check-in programados)
    this.reservaService.listarTodas().pipe(catchError(() => of({ data: [] }))).subscribe({
      next: (res) => {
        const todas = (res.data || []) as any[];
        const target = todas.filter(r =>
          r.fechaEntrada && this.toDateStr(new Date(r.fechaEntrada)) === fecha && r.estado !== 'CANCELADA' && r.estado !== 'NO_SHOW'
        );
        this.reservasDelDia = target;
        this.guardarCache(fecha, 'reservas', target);
        this.cdr.detectChanges();
      }
    });
  }

  private guardarCache(fecha: string, key: string, value: any): void {
    const entry = this.cache.get(fecha) || {};
    entry[key] = value;
    this.cache.set(fecha, entry);
  }

  private aplicarCache(cached: any): void {
    this.pisos = cached.pisos || [];
    this.reservasDelDia = cached.reservasDelDia || [];
    this.hospedajesActivos = cached.hospedajesActivos || [];
    this.habitacionesCount = cached.habitacionesCount || { total: 0, disponibles: 0, ocupadas: 0, limpieza: 0, mantenimiento: 0 };
    this.loading = false;
  }

  private cargarAuxiliares(): void {
    this.cajaService.obtenerActual().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.cajaInfo = res.data;
        this.cajaAbierta = res.data?.estado === 'ABIERTO';
        this.cdr.detectChanges();
      }
    });
    if (this.esHoy && this.authService.isAdmin()) {
      const hoy = new Date();
      const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
      this.reporteService.ingresos(hoyStr, hoyStr).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => { this.ingresosHoy = res.data?.total || 0; this.ingresosAdelantosFecha = res.data?.totalAdelantos || 0; this.cdr.detectChanges(); }
      });
    }
    this.hospedajeService.listarDeudasPendientes().subscribe({
      next: res => {
        const deudas = (res.data || []) as any[];
        this.deudasPendientesCount = deudas.length;
        this.deudasMontoTotal = deudas.reduce((sum, d) => sum + (d.deudaPendiente || 0), 0);
      },
      error: () => {}
    });
    this.verificarNotificaciones();
  }
}
