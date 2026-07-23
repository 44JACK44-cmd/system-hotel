import { Component, inject, NgZone, ApplicationRef, ChangeDetectorRef, AfterViewChecked, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { HabitacionService } from '../../../observable/habitacion.service';
import { ReservaService } from '../../../observable/reserva.service';
import { HospedajeService } from '../../../observable/hospedaje.service';
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

const T = () => performance.now().toFixed(2);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, TableModule, TagModule, CardModule, ButtonModule, SkeletonModule, TooltipModule, NuevaReservaComponent, CheckInComponent, CheckOutComponent, PagosModalComponent],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit, AfterViewChecked, OnDestroy {
  private router = inject(Router);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private habitacionService = inject(HabitacionService);
  private reservaService = inject(ReservaService);
  private hospedajeService = inject(HospedajeService);

  private destroy$ = new Subject<void>();

  showNuevaReserva = false;
  showCheckIn = false;
  showCheckOut = false;
  showPagos = false;
  selectedCheckOutId: number | null = null;
  loading = false;

  pisos: { numero: number; habitaciones: any[] }[] = [];
  reservasDelDia: any[] = [];
  hospedajesActivos: any[] = [];
  private huespedMap = new Map<string, string>();

  ngOnInit(): void {
    console.log(`[DASH] ${T()} ngOnInit() — loading=${this.loading}, pisos.length=${this.pisos.length}, inAngularZone=${NgZone.isInAngularZone()}`);
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    console.log(`[CD] ${T()} AfterViewChecked`);
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

  getRoomStatusColor(estado: string): string {
    const map: Record<string, string> = {
      DISPONIBLE: 'var(--clr-status-available)',
      OCUPADA: 'var(--clr-status-occupied)',
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
    console.log(`[DASH] ${T()} cargarDatos() INICIO — loading=true, inAngularZone=${NgZone.isInAngularZone()}`);

    const obsHabitaciones = this.habitacionService.listarActivas().pipe(
      catchError(() => {
        console.log(`[DASH] ${T()} catchError — habitaciones FALLÓ, retornando of({data:[]})`);
        return of({ data: [] });
      })
    );
    const obsReservas = this.reservaService.listarDelDia().pipe(
      catchError(() => {
        console.log(`[DASH] ${T()} catchError — reservas FALLÓ, retornando of({data:[]})`);
        return of({ data: [] });
      })
    );
    const obsHospedajes = this.hospedajeService.listarActivos().pipe(
      catchError(() => {
        console.log(`[DASH] ${T()} catchError — hospedajes FALLÓ, retornando of({data:[]})`);
        return of({ data: [] });
      })
    );

    forkJoin({
      habitaciones: obsHabitaciones,
      reservas: obsReservas,
      hospedajes: obsHospedajes
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ habitaciones, reservas, hospedajes }) => {
        console.log(`[DASH] ${T()} forkJoin.next() — DATOS RECIBIDOS, inAngularZone=${NgZone.isInAngularZone()}`);
        console.log(`[DASH] ${T()} forkJoin.next() — habitaciones=`, JSON.stringify(habitaciones).substring(0, 100));
        console.log(`[DASH] ${T()} forkJoin.next() — reservas=`, JSON.stringify(reservas).substring(0, 100));
        console.log(`[DASH] ${T()} forkJoin.next() — hospedajes=`, JSON.stringify(hospedajes).substring(0, 100));

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
        console.log(`[DASH] ${T()} ASIGNACIÓN COMPLETADA — pisos=${this.pisos.length}, reservas=${this.reservasDelDia.length}, hospedajes=${this.hospedajesActivos.length}`);
        this.loading = false;

        console.log('[TEST] loading=false');
        console.log('[TEST] BEFORE detectChanges');

        this.cdr.detectChanges();

        console.log('[TEST] AFTER detectChanges');

        console.log('[TEST] BEFORE appRef.tick');

        this.appRef.tick();

        console.log('[TEST] AFTER appRef.tick');

        const el = document.querySelector('.dash-page');
        console.log('[DOM] element', el);
        console.log('[DOM] computed', el ? getComputedStyle(el) : null);
        if (el) {
          const s = getComputedStyle(el);
          console.log('[DOM] display:', s.display);
          console.log('[DOM] visibility:', s.visibility);
          console.log('[DOM] opacity:', s.opacity);
          console.log('[DOM] transform:', s.transform);
          console.log('[DOM] height:', s.height);
          console.log('[DOM] overflow:', s.overflow);
          console.log('[DOM] content-visibility:', (s as any).contentVisibility);
        }
      },
      error: () => {
        console.log(`[DASH] ${T()} forkJoin.error() — ERROR`);
        this.loading = false;
      }
    });
    console.log(`[DASH] ${T()} cargarDatos() — subscribe() llamado, forkJoin en progreso`);
  }
}
