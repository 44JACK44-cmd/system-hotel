import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, Event, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './observable/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  private authService = inject(AuthService);

  get dashboardRoute(): string {
    return this.authService.isAdmin() ? '/admin/dashboard' : '/recepcion/dashboard';
  }

  isPublicPage = toSignal(
    this.router.events.pipe(
      filter((e: Event): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.checkPublicUrl())
    ),
    { initialValue: this.checkPublicUrl() }
  );

  private checkPublicUrl(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/login' || url === '/' || url === '' || url === '/access-denied';
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
