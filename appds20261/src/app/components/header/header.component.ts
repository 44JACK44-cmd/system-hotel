import { Component, inject, OnInit, OnDestroy, signal, Output, EventEmitter, HostListener, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../observable/auth.service';
import { AppConfigService } from '../../services/app-config.service';
import { NotificacionService } from '../../observable/notificacion.service';
import { ThemeService } from '../../services/theme.service';
import { EstadoActualizacionService } from '../../services/estado-actualizacion.service';
import { Subject, takeUntil } from 'rxjs';

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
  private themeService = inject(ThemeService);
  private notificacionService = inject(NotificacionService);
  private configService = inject(AppConfigService);
  protected cfg = this.configService.config;

  logoSrc = '';
  hotelNombre = '';
  sucursal = '';

  constructor() {
    effect(() => {
      const c = this.cfg();
      this.logoSrc = c.logo;
      this.hotelNombre = c.nombre;
      this.sucursal = [c.ciudad, c.departamento].filter(Boolean).join(', ') || c.ciudad || 'Sucursal';
    });
  }

  isDark = this.themeService.isDark;
  fechaHoraActual = signal<string>('');
  nombreUsuario = '';
  emailUsuario = '';
  rolUsuario = '';
  rolLabel = '';
  iniciales = '';
  fotoPerfil = '';
  profileOpen = signal(false);

  notifCount = 0;
  notifList: any[] = [];
  notifOpen = false;
  notifLoading = false;

  private intervalId: any;
  private notifIntervalId: any;
  private estadoActualizacion = inject(EstadoActualizacionService);
  private destroy$ = new Subject<void>();
  private elRef = inject(ElementRef);

  ngOnInit(): void {
    this.cargarUsuarioSesion();
    this.actualizarFechaHora();
    this.intervalId = setInterval(() => this.actualizarFechaHora(), 1000);
    this.cargarNotificaciones();
    this.notifIntervalId = setInterval(() => this.cargarContador(), 30000);
    this.estadoActualizacion.on('USUARIO_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarUsuarioSesion());
    this.estadoActualizacion.on('NOTIFICACION_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cargarContador();
      this.cargarNotificaciones();
    });
    this.configService.load();
  }

  private cargarUsuarioSesion(): void {
    const nombre = this.authService.getNombreCompleto() || 'Usuario';
    this.nombreUsuario = nombre;
    this.rolUsuario = this.authService.getRol() || '';
    this.rolLabel = this.authService.isAdmin() ? 'Administrador' : 'Recepcionista';
    this.emailUsuario = this.authService.getUsername() || '';
    this.fotoPerfil = this.authService.getFotoPerfil() || '';
    this.iniciales = nombre.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.notifIntervalId) clearInterval(this.notifIntervalId);
    this.destroy$.next();
    this.destroy$.complete();
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

  private cargarContador(): void {
    this.notificacionService.contarPendientes().subscribe({
      next: res => { if (res.data !== undefined) this.notifCount = res.data as number; }
    });
  }

  private cargarNotificaciones(): void {
    this.notificacionService.listarPendientes().subscribe({
      next: res => {
        this.notifList = res.data || [];
        this.notifCount = this.notifList.length;
      }
    });
  }

  toggleNotif(): void {
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen) this.cargarNotificaciones();
  }

  marcarLeida(n: any): void {
    this.notificacionService.marcarLeida(n.id).subscribe({
      next: () => {
        n.leida = true;
        this.notifList = this.notifList.filter((x: any) => !x.leida);
        this.notifCount = this.notifList.length;
      }
    });
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas().subscribe({
      next: () => {
        this.notifList = [];
        this.notifCount = 0;
      }
    });
  }

  irAIncidencia(n: any): void {
    if (n.entidadTipo === 'INCIDENCIA' && n.entidadId) {
      this.marcarLeida(n);
      this.notifOpen = false;
      this.router.navigate(['/recepcion/incidencias']);
    }
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.profileOpen()) {
      const target = event.target as HTMLElement;
      const profileWrap = this.elRef.nativeElement.querySelector('.hs-topbar__profile-wrap');
      if (profileWrap && !profileWrap.contains(target)) {
        this.profileOpen.set(false);
      }
    }
  }

  get avatarColor(): string {
    const colors: Record<string, string> = {
      ADMIN: '#1a73e8',
      RECEPCIONISTA: '#34a853',
      GERENTE: '#ea4335',
      SUPERVISOR: '#fbbc04'
    };
    return colors[this.rolUsuario] || '#6c757d';
  }

  toggleProfile(): void {
    this.profileOpen.update(v => !v);
  }

  cerrarProfile(): void {
    this.profileOpen.set(false);
  }

  logout(): void {
    this.cerrarProfile();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private cargarLogo(): void {}

  irConfiguracion(): void {
    this.cerrarProfile();
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin', 'configuracion']);
    } else {
      this.router.navigate(['/recepcion', 'configuracion']);
    }
  }

  irPerfil(): void {
    this.cerrarProfile();
    this.router.navigate(['/perfil']);
  }

  irActividad(): void {
    this.cerrarProfile();
    this.router.navigate(['/actividad']);
  }
}
