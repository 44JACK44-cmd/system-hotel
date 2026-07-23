import { Component, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet, Event, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { filter } from 'rxjs/operators';
import { AuthService } from './observable/auth.service';
import { LayoutStateService } from './services/layout-state.service';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

const T = () => performance.now().toFixed(2);

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, HeaderComponent, SidebarComponent, ToastModule],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  protected layoutState = inject(LayoutStateService);
  private routerSub: Subscription | null = null;

  isPublicPage = true;
  mobileDrawerOpen = false;

  get dashboardRoute(): string {
    return this.authService.isAdmin() ? '/admin/dashboard' : '/recepcion/dashboard';
  }

  get rolLabel(): string {
    return this.authService.isAdmin() ? 'Vista Administrador' : 'Vista Recepcionista';
  }

  get mobileMenuItems(): MenuItem[] {
    const items: MenuItem[] = [
      { label: 'Dashboard',       icon: 'dashboard',          route: this.dashboardRoute },
      { label: 'Reservas',        icon: 'calendar_month',     route: '/recepcion/reservas' },
      { label: 'Hospedajes',      icon: 'hotel',              route: '/recepcion/hospedajes' },
      { label: 'Clientes',        icon: 'group',              route: '/recepcion/clientes' },
      { label: 'Pagos',           icon: 'payments',           route: '/recepcion/pagos' },
      { label: 'Incidencias',     icon: 'cleaning_services',  route: '/recepcion/incidencias' },
    ];
    if (this.authService.isAdmin()) {
      items.push(
        { label: 'Habitaciones',  icon: 'bed',                route: '/admin/habitaciones' },
        { label: 'Usuarios',      icon: 'manage_accounts',    route: '/admin/usuarios' },
        { label: 'Reportes',      icon: 'bar_chart',          route: '/admin/reportes' },
        { label: 'Configuración', icon: 'settings',           route: '/admin/configuracion' },
      );
    }
    return items;
  }

  ngOnInit(): void {
    this.isPublicPage = this.checkPublicUrl();
    console.log(`[APP] ${T()} ngOnInit() — URL inicial: ${this.router.url}, inAngularZone=${NgZone.isInAngularZone()}`);
    this.routerSub = this.router.events.pipe(
      filter((e: Event): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      this.isPublicPage = this.checkPublicUrl();
      console.log(`[APP] ${T()} NavigationEnd — url: ${e.url}, urlAfterRedirects: ${e.urlAfterRedirects}, isPublicPage: ${this.isPublicPage}, overlayActive: ${this.layoutState.overlayActive()}, mobileDrawerOpen: ${this.mobileDrawerOpen}, inAngularZone=${NgZone.isInAngularZone()}`);
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private checkPublicUrl(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/login' || url === '/' || url === '' || url === '/access-denied';
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  toggleMobileDrawer(): void {
    this.mobileDrawerOpen = !this.mobileDrawerOpen;
    this.layoutState.setOverlay(this.mobileDrawerOpen);
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen = false;
    this.layoutState.setOverlay(false);
  }

  centroAyuda(): void {
    this.messageService.add({ severity: 'info', summary: 'Centro de Ayuda', detail: 'Contacte al administrador del sistema para asistencia.' });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
