import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../observable/auth.service';

interface MenuItem {
  label: string;
  icon: string;   // material-symbols-outlined name
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

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
    // Allow routerLink to handle navigation; method kept for potential side-effects
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
