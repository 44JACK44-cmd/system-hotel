import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ConfiguracionService } from '../../../observable/configuracion.service';
import { AppConfigService } from '../../../services/app-config.service';
import { AuthService } from '../../../observable/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../api/environment';

@Component({
  selector: 'app-recepcion-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './recepcion-configuracion.html',
  styleUrl: './recepcion-configuracion.css',
})
export class RecepcionConfiguracion implements OnInit {
  private configSvc = inject(ConfiguracionService);
  private appConfigSvc = inject(AppConfigService);
  authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private estadoActualizacion = inject(EstadoActualizacionService);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);

  isDark = this.themeService.isDark;
  activeTab = 'mis-preferencias';

  params: Record<string, string> = {};
  paramsMeta: Record<string, any> = {};
  loading = true;
  saving = false;

  logoPreview = '';
  uploadingLogo = false;

  ngOnInit(): void {
    this.cargarParametros();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  cargarParametros(): void {
    this.loading = true;
    this.configSvc.listarTodos().subscribe({
      next: res => {
        if (res.success && res.data) {
          for (const p of res.data) {
            this.params[p.clave] = p.valor || '';
            this.paramsMeta[p.clave] = p;
          }
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get logosrc(): string {
    return this.logoPreview || this.params['hotel.logo'] || '';
  }

  onLogoSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Solo se permiten imagenes' }); return; }
    if (file.size > 2 * 1024 * 1024) { this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La imagen no debe superar los 2MB' }); return; }
    this.uploadingLogo = true;
    const formData = new FormData();
    formData.append('file', file);
    this.http.post<any>(`${environment.apiUrl}/parametro/uploadlogo`, formData).subscribe({
      next: (res) => {
        this.uploadingLogo = false;
        if (res.success && res.listParametro?.[0]) {
          const p = res.listParametro[0];
          this.params['hotel.logo'] = p.valor || '';
          this.paramsMeta['hotel.logo'] = p;
          this.logoPreview = '';
          this.appConfigSvc.refresh();
          this.estadoActualizacion.configuracionCambio();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Logo actualizado' });
        }
      },
      error: () => { this.uploadingLogo = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al subir logo' }); }
    });
  }

  isDirty(): boolean {
    return Object.keys(this.paramsMeta).some(k => this.paramsMeta[k].valor !== this.params[k]);
  }

  guardarHotel(): void {
    this.saving = true;
    const hotelKeys = ['hotel.nombre', 'hotel.ruc', 'hotel.direccion', 'hotel.telefono', 'hotel.email'];
    const observables: ReturnType<typeof this.configSvc.updateValor>[] = [];

    for (const clave of hotelKeys) {
      const meta = this.paramsMeta[clave];
      if (meta && meta.valor !== this.params[clave]) {
        observables.push(this.configSvc.updateValor(clave, this.params[clave]));
      }
    }

    if (observables.length === 0) {
      this.saving = false;
      this.messageService.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hay cambios para guardar.' });
      return;
    }

    forkJoin(observables).subscribe({
      next: (results) => {
        for (const r of results) {
          if (r.success && r.data) {
            this.paramsMeta[r.data.clave] = r.data;
          }
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar.' });
      },
      complete: () => {
        this.saving = false;
        this.appConfigSvc.refresh();
        this.estadoActualizacion.configuracionCambio();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Datos guardados correctamente' });
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
