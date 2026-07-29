import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../observable/auth.service';
import { ReporteService } from '../../../observable/reporte.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, merge, auditTime, takeUntil } from 'rxjs';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private reporteService = inject(ReporteService);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private estadoActualizacion = inject(EstadoActualizacionService);
  private destroy$ = new Subject<void>();

  mesActual = '';
  loading = false;
  ingresos: any = null;
  ocupacion: any = null;

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
    const now = new Date();
    const meses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SETIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    this.mesActual = `${meses[now.getMonth()]} ${now.getFullYear()}`;
    this.cargarReportes();
    merge(
      this.estadoActualizacion.on('PAGO_CAMBIO'), this.estadoActualizacion.on('HOSPEDAJE_CAMBIO'),
      this.estadoActualizacion.on('RESERVA_CAMBIO'), this.estadoActualizacion.on('HABITACION_CAMBIO'),
      this.estadoActualizacion.on('CONSUMO_CAMBIO')
    ).pipe(auditTime(0), takeUntil(this.destroy$)).subscribe(() => this.cargarReportes());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private cargarReportes(): void {
    this.loading = true;
    const hoy = new Date();
    const today = hoy.toISOString().split('T')[0];
    const firstDay = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    this.reporteService.ingresos(firstDay, today).subscribe({
      next: res => { this.ingresos = res.data; },
      error: () => {}
    });
    this.reporteService.ocupacion(today).subscribe({
      next: res => { this.ocupacion = res.data; this.loading = false; this.cdr.detectChanges(); this.appRef.tick(); },
      error: () => this.loading = false
    });
  }
}
