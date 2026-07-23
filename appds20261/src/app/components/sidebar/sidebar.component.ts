import { Component, inject, ChangeDetectorRef, ApplicationRef, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../observable/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { filter, Subject, takeUntil } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;   // material-symbols-outlined name
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule],
  providers: [MessageService],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private destroy$ = new Subject<void>();

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.cdr.detectChanges();
      this.appRef.tick();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get rolLabel(): string {
    return this.authService.isAdmin() ? 'Vista Administrador' : 'Vista Recepcionista';
  }

  get quickCheckInRoute(): string {
    return '/recepcion/dashboard';
  }

  get filteredMenu(): MenuItem[] {
    if (this.authService.isAdmin()) {
      return [
        { label: 'Dashboard',    icon: 'dashboard',          route: '/admin/dashboard'      },
        { label: 'Recepción',    icon: 'concierge',          route: '/recepcion/dashboard'  },
        { label: 'Habitaciones', icon: 'bed',                route: '/admin/habitaciones'   },
        { label: 'Reservas',     icon: 'calendar_month',     route: '/recepcion/reservas'   },
        { label: 'Clientes',     icon: 'group',              route: '/recepcion/clientes'   },
        { label: 'Hospedajes',   icon: 'hotel',              route: '/recepcion/hospedajes' },
        { label: 'Pagos',        icon: 'payments',           route: '/recepcion/pagos'      },
        { label: 'Incidencias',  icon: 'cleaning_services',  route: '/recepcion/incidencias'},
        { label: 'Usuarios',     icon: 'manage_accounts',    route: '/admin/usuarios'       },
        { label: 'Reportes',     icon: 'bar_chart',          route: '/admin/reportes'       },
        { label: 'Configuración', icon: 'settings',          route: '/admin/configuracion'  },
      ];
    }
    return [
      { label: 'Recepción',    icon: 'concierge',         route: '/recepcion/dashboard'  },
      { label: 'Reservas',     icon: 'calendar_month',    route: '/recepcion/reservas'   },
      { label: 'Clientes',     icon: 'group',             route: '/recepcion/clientes'   },
      { label: 'Hospedajes',   icon: 'hotel',             route: '/recepcion/hospedajes' },
      { label: 'Pagos',        icon: 'payments',          route: '/recepcion/pagos'      },
      { label: 'Incidencias',  icon: 'cleaning_services', route: '/recepcion/incidencias'},
    ];
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }

  centroAyuda(): void {
    this.messageService.add({ severity: 'info', summary: 'Centro de Ayuda', detail: 'Contacte al administrador del sistema para asistencia.' });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
