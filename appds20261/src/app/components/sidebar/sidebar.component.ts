import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../observable/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  get rolLabel(): string {
    return this.authService.isAdmin() ? 'Vista Administrador' : 'Vista Recepcionista';
  }

  get quickCheckInRoute(): string {
    return this.authService.isAdmin() ? '/recepcion/dashboard' : '/recepcion/dashboard';
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

  isActive(route: string): boolean {
    return this.router.isActive(route, {
      paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored'
    }) || this.router.isActive(route, {
      paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored'
    });
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }

  handleNavClick(route: string): void {
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
