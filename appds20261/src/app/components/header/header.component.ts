import { Component, inject, OnInit, OnDestroy, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../observable/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() menuToggle = new EventEmitter<void>();
  private authService = inject(AuthService);
  private router = inject(Router);

  fechaHoraActual = signal<string>('');
  nombreUsuario = '';
  rolLabel = '';
  iniciales = '';

  private intervalId: any;

  ngOnInit(): void {
    const nombre = this.authService.getNombreCompleto() || 'Usuario';
    this.nombreUsuario = nombre;
    this.rolLabel = this.authService.isAdmin() ? 'Administrador' : 'Recepcionista';
    this.iniciales = nombre.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
    this.actualizarFechaHora();
    this.intervalId = setInterval(() => this.actualizarFechaHora(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private actualizarFechaHora(): void {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-PE', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
    const hora = ahora.toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
    this.fechaHoraActual.set(`${fecha}  •  ${hora}`);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  irConfiguracion(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin', 'configuracion']);
    }
  }
}
