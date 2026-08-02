import { Component, inject, OnInit, OnDestroy, signal, Output, EventEmitter, HostListener, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../observable/auth.service';
import { AppConfigService } from '../../services/app-config.service';
import { NotificacionService } from '../../observable/notificacion.service';
import { AlertaService, Alerta, AlertaAccion, ActividadEntry, AlertaConfig } from '../../services/alerta.service';
import { ThemeService } from '../../services/theme.service';
import { EstadoActualizacionService } from '../../services/estado-actualizacion.service';
import { Subject, takeUntil } from 'rxjs';

type VistaAlerta = 'alertas' | 'actividad';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() menuToggle = new EventEmitter<void>();
  private authService = inject(AuthService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private notificacionService = inject(NotificacionService);
  private alertaService = inject(AlertaService);
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

  alertList: Alerta[] = [];
  actividadList: ActividadEntry[] = [];
  activeVista: VistaAlerta = 'alertas';
  alertaConfig: AlertaConfig | null = null;

  // Track nuevas alertas para animación
  private nuevosGruposIds = new Set<string>();

  filtroTipo: 'TODOS' | 'URGENTE' | 'IMPORTANTE' | 'EXITO' = 'TODOS';
  filtroCategoria = 'TODAS';
  filtroLectura: 'TODAS' | 'NOLEIDAS' | 'LEIDAS' = 'TODAS';
  busqueda = '';
  orden: 'RECIENTES' | 'ANTIGUAS' | 'PRIORIDAD_ALTA' | 'PRIORIDAD_BAJA' = 'RECIENTES';

  filtrosPrioridad = [
    { label: 'Todos', valor: 'TODOS' },
    { label: 'Urgentes', valor: 'URGENTE' },
    { label: 'Importantes', valor: 'IMPORTANTE' }
  ];
  filtrosCategoria = [
    { label: 'Todas', valor: 'TODAS' },
    { label: 'Incidencias', valor: 'INCIDENCIA' },
    { label: 'Caja', valor: 'CAJA' },
    { label: 'Pagos', valor: 'PAGO' },
    { label: 'Reservas', valor: 'RESERVA' },
    { label: 'Habitaciones', valor: 'HABITACION' },
    { label: 'Clientes', valor: 'CLIENTE' },
    { label: 'Check-In', valor: 'CHECKIN' },
    { label: 'Check-Out', valor: 'CHECKOUT' }
  ];
  filtrosLectura = [
    { label: 'Todas', valor: 'TODAS' },
    { label: 'No leídas', valor: 'NOLEIDAS' },
    { label: 'Leídas', valor: 'LEIDAS' }
  ];

  etiquetaTipo(tipo: string): string {
    switch (tipo) {
      case 'URGENTE': return 'URGENTE';
      case 'CRITICA': return 'CRÍTICA';
      case 'IMPORTANTE': return 'IMPORTANTE';
      case 'AVISO': return 'AVISO';
      case 'INFORMATIVA': return 'INFO';
      case 'EXITO': return 'ÉXITO';
      default: return tipo;
    }
  }

  private intervalId: any;
  private estadoActualizacion = inject(EstadoActualizacionService);
  private destroy$ = new Subject<void>();
  private elRef = inject(ElementRef);

  ngOnInit(): void {
    this.cargarUsuarioSesion();
    this.actualizarFechaHora();
    this.intervalId = setInterval(() => this.actualizarFechaHora(), 1000);
    this.cargarNotificaciones();
    this.cargarAlertas();
    this.cargarConfiguracion();
    this.setupEventListeners();
    this.configService.load();
  }

  private setupEventListeners(): void {
    const refrescar = () => {
      this.cargarAlertas();
      this.cargarNotificaciones();
    };
    const eventos = [
      'NOTIFICACION_CAMBIO', 'HOSPEDAJE_CAMBIO', 'RESERVA_CAMBIO',
      'PAGO_CAMBIO', 'CLIENTE_CAMBIO', 'CAJA_CAMBIO',
      'INCIDENCIA_CAMBIO', 'HABITACION_CAMBIO', 'CONSUMO_CAMBIO',
      'USUARIO_CAMBIO', 'CONFIGURACION_CAMBIO'
    ] as const;
    eventos.forEach(evt => {
      this.estadoActualizacion.on(evt).pipe(takeUntil(this.destroy$)).subscribe(() => refrescar());
    });
    // Reflejar inmediatamente cambios de perfil (nombre/foto) tras guardar
    this.estadoActualizacion.on('USUARIO_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cargarUsuarioSesion();
    });
  }

  get totalNoLeidas(): number {
    return this.alertList.filter(a => !a.leida).length + this.notifCount;
  }

  get hayAlertasUrgentes(): boolean {
    return this.alertList.some(a => a.tipo === 'URGENTE');
  }

  // Helpers para acciones masivas
  get checkoutCount(): number {
    return this.alertList.filter(a => a.categoria === 'CHECKOUT' && (a.tipo === 'URGENTE' || a.tipo === 'AVISO')).length;
  }
  get incidenciaCount(): number {
    return this.alertList.filter(a => a.categoria === 'INCIDENCIA').length;
  }
  get checkinCount(): number {
    return this.alertList.filter(a => a.categoria === 'CHECKIN').reduce((sum, a) => sum + (a.cantidad || 1), 0);
  }
  get cajaCount(): number {
    return this.alertList.filter(a => a.categoria === 'CAJA').length;
  }
  get informativasCount(): number {
    return this.alertList.filter(a => a.tipo === 'INFORMATIVA' || a.tipo === 'EXITO' || a.tipo === 'AVISO').length;
  }

  hayCheckOutsVencidos(): boolean { return this.checkoutCount > 0; }
  hayIncidenciasActivas(): boolean { return this.incidenciaCount > 0; }
  hayCheckInsPendientes(): boolean { return this.checkinCount > 0; }
  hayCajasAbiertas(): boolean { return this.cajaCount > 0; }
  hayInformativasParaDescartar(): boolean { return this.informativasCount > 0; }
  hayAccionesMasivas(): boolean {
    return this.hayCheckOutsVencidos() || this.hayIncidenciasActivas() || this.hayCheckInsPendientes() || this.hayCajasAbiertas() || this.hayInformativasParaDescartar();
  }

  get alertasCriticas(): Alerta[] { return this.alertList.filter(a => a.tipo === 'CRITICA'); }
  get alertasImportantes(): Alerta[] { return this.alertList.filter(a => a.tipo === 'IMPORTANTE'); }
  get alertasInformativas(): Alerta[] { return this.alertList.filter(a => a.tipo === 'INFORMATIVA'); }
  get alertasExito(): Alerta[] { return this.alertList.filter(a => a.tipo === 'EXITO'); }

  get alertasFiltradas(): Alerta[] {
    const q = this.busqueda.trim().toLowerCase();
    let list = this.alertList.filter(a => {
      if (this.filtroTipo === 'URGENTE' && a.tipo !== 'URGENTE') return false;
      if (this.filtroTipo === 'IMPORTANTE' && a.tipo !== 'CRITICA' && a.tipo !== 'IMPORTANTE') return false;
      if (this.filtroTipo === 'EXITO' && a.tipo !== 'EXITO') return false;
      if (this.filtroCategoria !== 'TODAS') {
        if (this.filtroCategoria === 'RESERVA') {
          if (a.modulo !== 'RESERVA') return false;
        } else if (this.filtroCategoria === 'HABITACION') {
          if (a.modulo !== 'HABITACION') return false;
        } else if (a.categoria !== this.filtroCategoria) {
          return false;
        }
      }
      if (this.filtroLectura === 'NOLEIDAS' && a.leida) return false;
      if (this.filtroLectura === 'LEIDAS' && !a.leida) return false;
      if (q) {
        const haystack = [a.titulo, a.descripcion, a.modulo, a.tipo, a.categoria, a.entidadTipo, a.hora, a.fecha].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const prioridadMap: Record<string, number> = { URGENTE: 0, CRITICA: 1, IMPORTANTE: 2, AVISO: 3, INFORMATIVA: 4, EXITO: 5 };
    switch (this.orden) {
      case 'ANTIGUAS':
        list = [...list].sort((x, y) => (x.timestamp || '').localeCompare(y.timestamp || ''));
        break;
      case 'PRIORIDAD_ALTA':
        list = [...list].sort((x, y) => (prioridadMap[x.tipo] ?? 9) - (prioridadMap[y.tipo] ?? 9));
        break;
      case 'PRIORIDAD_BAJA':
        list = [...list].sort((x, y) => (prioridadMap[y.tipo] ?? -1) - (prioridadMap[x.tipo] ?? -1));
        break;
      default:
        list = [...list].sort((x, y) => (y.timestamp || '').localeCompare(x.timestamp || ''));
    }
    return list;
  }

  setVista(v: VistaAlerta): void { this.activeVista = v; }

  setFiltroTipo(t: 'TODOS' | 'URGENTE' | 'IMPORTANTE' | 'EXITO'): void { this.filtroTipo = t; }
  setFiltroCategoria(c: string): void { this.filtroCategoria = c; }
  setFiltroLectura(l: 'TODAS' | 'NOLEIDAS' | 'LEIDAS'): void { this.filtroLectura = l; }
  setOrden(o: 'RECIENTES' | 'ANTIGUAS' | 'PRIORIDAD_ALTA' | 'PRIORIDAD_BAJA'): void { this.orden = o; }
  limpiarBusqueda(): void { this.busqueda = ''; }

  tiempoRelativo(timestamp: string): string {
    if (!timestamp) return '';
    const fecha = new Date(timestamp);
    if (isNaN(fecha.getTime())) return '';
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    if (diffMs < 0) return 'Ahora mismo';
    const minutos = Math.floor(diffMs / 60000);
    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return minutos === 1 ? 'Hace 1 minuto' : `Hace ${minutos} minutos`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return horas === 1 ? 'Hace 1 hora' : `Hace ${horas} horas`;
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const dias = Math.round((hoy.getTime() - f.getTime()) / 86400000);
    if (dias === 1) return 'Ayer';
    if (dias > 1 && dias < 7) return `Hace ${dias} días`;
    return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  private actualizarFechaHora(): void {
    const ahora = new Date();
    this.fechaHoraActual.set(
      ahora.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
      + '  •  ' +
      ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
    );
  }

  private cargarNotificaciones(): void {
    this.notificacionService.listarPendientes().subscribe({
      next: res => {
        this.notifList = res.data || [];
        this.notifCount = this.notifList.length;
      }
    });
  }

  private cargarAlertas(): void {
    this.alertaService.getAlertas().subscribe({
      next: alertas => {
        const prevAlta = this.alertList.filter(a => (a.tipo === 'URGENTE' || a.tipo === 'CRITICA') && !a.leida).length;
        
        // Detectar alertas nuevas
        const prevIds = new Set(this.alertList.map(a => a.grupoId));
        const nuevas = alertas.filter(a => !prevIds.has(a.grupoId));
        nuevas.forEach(a => this.nuevosGruposIds.add(a.grupoId));
        
        this.alertList = alertas;
        const newAlta = alertas.filter(a => (a.tipo === 'URGENTE' || a.tipo === 'CRITICA') && !a.leida).length;
        if (newAlta > prevAlta && this.alertaConfig?.sonidoActivado !== false) {
          this.alertaService.playSound();
        }
      }
    });
  }

  esNuevaAlerta(grupoId: string): boolean {
    return this.nuevosGruposIds.has(grupoId);
  }

  marcarAlertaVista(grupoId: string): void {
    this.nuevosGruposIds.delete(grupoId);
  }

  private cargarActividad(): void {
    this.alertaService.getActividad().subscribe({
      next: list => this.actividadList = list
    });
  }

  private cargarConfiguracion(): void {
    this.alertaService.getConfiguracion().subscribe({
      next: c => this.alertaConfig = c
    });
  }

  toggleNotif(): void {
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen) {
      const f = this.alertaService.activeFilter();
      if (f) {
        this.aplicarFiltroExterno(f);
        this.alertaService.activeFilter.set(null);
      }
      this.cargarNotificaciones();
      this.cargarAlertas();
      this.cargarActividad();
    }
  }

  private aplicarFiltroExterno(f: string): void {
    this.activeVista = 'alertas';
    switch (f) {
      case 'URGENTE': this.filtroTipo = 'URGENTE'; break;
      case 'IMPORTANTE': this.filtroTipo = 'IMPORTANTE'; break;
      case 'EXITO': this.filtroTipo = 'EXITO'; break;
      case 'NOLEIDAS': this.filtroLectura = 'NOLEIDAS'; break;
      case 'COMPLETADAS': this.filtroTipo = 'EXITO'; break;
      default: this.filtroTipo = 'TODOS';
    }
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

  marcarAlertaLeida(a: Alerta): void {
    this.alertaService.marcarLeida(a.grupoId).subscribe({
      next: () => {
        a.leida = true;
        this.alertList = [...this.alertList];
      }
    });
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas().subscribe({
      next: () => { this.notifList = []; this.notifCount = 0; }
    });
    this.alertaService.marcarTodasLeidas().subscribe({
      next: () => {
        this.alertList = this.alertList.map(a => ({ ...a, leida: true }));
      }
    });
  }

  // Acciones masivas
  descartarInformativas(): void {
    this.alertaService.marcarTodasLeidas().subscribe({
      next: () => {
        this.alertList = this.alertList.map(a => {
          if (a.tipo === 'INFORMATIVA' || a.tipo === 'EXITO' || a.tipo === 'AVISO') {
            return { ...a, leida: true };
          }
          return a;
        });
      }
    });
  }

  resolverIncidencias(): void {
    this.notifOpen = false;
    this.router.navigate(['/recepcion/incidencias'], { state: { accion: 'resolver-todas' } });
  }

  abrirCheckIns(): void {
    this.notifOpen = false;
    this.router.navigate(['/recepcion/reservas'], { state: { accion: 'checkin-todos', cantidad: this.checkinCount } });
  }

  abrirCheckOuts(): void {
    this.notifOpen = false;
    const ids = this.alertList
      .filter(a => a.categoria === 'CHECKOUT' && (a.tipo === 'URGENTE' || a.tipo === 'AVISO') && a.entidadId)
      .map(a => a.entidadId);
    this.router.navigate(['/recepcion/hospedajes'], { state: { accion: 'checkout-todos', entidades: ids } });
  }

  cerrarCajas(): void {
    this.notifOpen = false;
    this.router.navigate(['/recepcion/pagos'], { state: { accion: 'cerrar-cajas' } });
  }

  irAIncidencia(n: any): void {
    if (n.entidadTipo === 'INCIDENCIA' && n.entidadId) {
      this.marcarLeida(n);
      this.notifOpen = false;
      this.router.navigate(['/recepcion/incidencias']);
    }
  }

  navegarAlerta(a: Alerta): void {
    console.log('[ALERTAS] Click recibido en navegarAlerta:', { grupoId: a.grupoId, entidadTipo: a.entidadTipo, entidadId: a.entidadId, accion: a.accion });
    this.marcarAlertaLeida(a);
    this.notifOpen = false;
    if (a.entidadTipo && a.entidadId) {
      console.log('[ALERTAS] Navegando con entidad (alerta):', a.entidadTipo, a.entidadId, a.accion);
      this.navegarEntidad(a.entidadTipo, a.entidadId, a.accion);
    } else if (a.accion) {
      console.log('[ALERTAS] Navegando simple (alerta):', a.accion);
      this.router.navigate([a.accion]);
    }
  }

  ejecutarAccion(a: Alerta, accion: AlertaAccion): void {
    console.log('[ALERTAS] Click recibido en ejecutarAccion:', { alerta: a.grupoId, accion: accion.label });
    if (!a.leida) this.marcarAlertaLeida(a);
    this.notifOpen = false;
    if (accion.entidadTipo) {
      console.log('[ALERTAS] Navegando con entidad:', accion.entidadTipo, accion.entidadId, accion.label);
      this.navegarEntidad(accion.entidadTipo, accion.entidadId, accion.label);
    } else if (accion.accion) {
      console.log('[ALERTAS] Navegando simple:', accion.accion);
      this.router.navigate([accion.accion]);
    }
  }

  private navegarEntidad(tipo: string, id: number | null, accionExtra?: string): void {
    const navigationExtras = id ? { state: { entidadId: id, accion: accionExtra } } : {};
    console.log('[ALERTAS] navegarEntidad:', { tipo, id, accionExtra, navigationExtras });
    switch (tipo) {
      case 'HOSPEDAJE': this.router.navigate(['/recepcion/hospedajes'], navigationExtras); break;
      case 'RESERVA': this.router.navigate(['/recepcion/reservas'], navigationExtras); break;
      case 'HABITACION': this.router.navigate([this.authService.isAdmin() ? '/admin/habitaciones' : '/recepcion/hospedajes'], navigationExtras); break;
      case 'INCIDENCIA': this.router.navigate(['/recepcion/incidencias'], navigationExtras); break;
      case 'CAJA': this.router.navigate(['/recepcion/pagos'], navigationExtras); break;
      case 'CLIENTE': this.router.navigate(['/recepcion/clientes'], navigationExtras); break;
      case 'PAGO': this.router.navigate(['/recepcion/pagos'], navigationExtras); break;
    }
  }

  toggleTheme(): void { this.themeService.toggle(); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.profileOpen()) {
      const target = event.target as HTMLElement;
      const profileWrap = this.elRef.nativeElement.querySelector('.hs-topbar__profile-wrap');
      if (profileWrap && !profileWrap.contains(target)) this.profileOpen.set(false);
    }
  }

  get avatarColor(): string {
    const colors: Record<string, string> = { ADMIN: '#1a73e8', RECEPCIONISTA: '#34a853', GERENTE: '#ea4335', SUPERVISOR: '#fbbc04' };
    return colors[this.rolUsuario] || '#6c757d';
  }

  toggleProfile(): void { this.profileOpen.update(v => !v); }
  cerrarProfile(): void { this.profileOpen.set(false); }

  logout(): void {
    this.cerrarProfile();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private cargarLogo(): void {}

  irConfiguracion(): void {
    this.cerrarProfile();
    this.router.navigate(this.authService.isAdmin() ? ['/admin', 'configuracion'] : ['/recepcion', 'configuracion']);
  }
  irPerfil(): void { this.cerrarProfile(); this.router.navigate(['/perfil']); }
  irActividad(): void { this.cerrarProfile(); this.router.navigate(['/actividad']); }
}
