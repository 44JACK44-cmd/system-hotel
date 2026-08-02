import { Component, HostListener, inject, ApplicationRef, ChangeDetectorRef, NgZone, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  imports: [CommonModule, RouterModule, TableModule, TagModule, CardModule, ButtonModule, SkeletonModule, TooltipModule, NuevaReservaComponent, CheckInComponent, CheckOutComponent, PagosModalComponent],
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
  deudasPendientesCount: number = 0;
  alertResumen = { urgentes: 0, criticas: 0, importantes: 0, avisos: 0, informativas: 0, exitos: 0, total: 0, noLeidas: 0, pendientes: 0, completadasHoy: 0 };
  deudasMontoTotal: number = 0;

  pisos: { numero: number; habitaciones: any[] }[] = [];
  reservasDelDia: any[] = [];
  hospedajesActivos: any[] = [];
  private huespedMap = new Map<string, string>();

  ngOnInit(): void {
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

        this.loading = false;

        this.cdr.detectChanges();

        this.appRef.tick();

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        this.cajaService.obtenerActual().pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            this.cajaInfo = res.data;
            this.cajaAbierta = res.data?.estado === 'ABIERTO';
            this.cdr.detectChanges();
          }
        });
        if (this.authService.isAdmin()) {
          this.reporteService.ingresos(todayStr, todayStr).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res) => { this.ingresosHoy = res.data?.total || 0; this.cdr.detectChanges(); }
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
      },
      error: () => {
        this.loading = false;
        this.appRef.tick();
      }
    });
  }
}
