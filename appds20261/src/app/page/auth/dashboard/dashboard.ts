import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, TableModule, TagModule, CardModule, ButtonModule, SkeletonModule, TooltipModule, NuevaReservaComponent, CheckInComponent, CheckOutComponent, PagosModalComponent],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit, OnDestroy {
  private router = inject(Router);
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
    this.cargarDatos();
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
    forkJoin({
      habitaciones: this.habitacionService.listarActivas().pipe(catchError(() => of({ data: [] }))),
      reservas: this.reservaService.listarDelDia().pipe(catchError(() => of({ data: [] }))),
      hospedajes: this.hospedajeService.listarActivos().pipe(catchError(() => of({ data: [] })))
    }    ).pipe(takeUntil(this.destroy$)).subscribe({ next: ({ habitaciones, reservas, hospedajes }) => {
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
      this.loading = false;
    }, error: () => this.loading = false });
  }
}
