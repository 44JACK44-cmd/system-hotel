import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../observable/auth.service';
import { ReporteService } from '../../../observable/reporte.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private authService = inject(AuthService);
  private reporteService = inject(ReporteService);

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
  }

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
      next: res => { this.ocupacion = res.data; this.loading = false; },
      error: () => this.loading = false
    });
  }
}
