import { Component, ChangeDetectorRef, ApplicationRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ConfiguracionService } from '../../../observable/configuracion.service';
import { AppConfigService } from '../../../services/app-config.service';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';
import { HabitacionService } from '../../../observable/habitacion.service';
import { ParametroResponse, HabitacionResponse } from '../../../shared/models';
import { environment } from '../../../api/environment';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule, SelectModule, InputTextModule, CheckboxModule, TextareaModule, ToastModule],
  providers: [MessageService],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion implements OnInit {
  activeTab = 'datos-hotel';

  params: Record<string, string> = {};
  paramsMeta: Record<string, ParametroResponse> = {};
  loading = true;
  saving = false;
  saved = false;

  habitaciones: HabitacionResponse[] = [];

  logoPreview = '';
  uploadingLogo = false;

  private appConfigSvc = inject(AppConfigService);
  private estadoActualizacion = inject(EstadoActualizacionService);
  private messageService = inject(MessageService);

  constructor(
    private configSvc: ConfiguracionService,
    private habSvc: HabitacionService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  switchTab(tabId: string) {
    this.activeTab = tabId;
    this.saved = false;
  }

  cargarDatos() {
    this.loading = true;
    this.configSvc.listarTodos().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          for (const p of res.data) {
            this.params[p.clave] = p.valor || '';
            this.paramsMeta[p.clave] = p;
          }
        }
        this.cargarHabitaciones();
      },
      error: () => this.cargarHabitaciones()
    });
  }

  private cargarHabitaciones() {
    this.habSvc.listarActivas().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.habitaciones = res.data;
        }
        this.loading = false;
        this.cdr.detectChanges();
        this.appRef.tick();
      },
      error: () => { this.loading = false; }
    });
  }

  isDirty(): boolean {
    return Object.keys(this.paramsMeta).some(k =>
      this.paramsMeta[k].valor !== this.params[k]
    );
  }

  guardarTodo() {
    this.saving = true;
    this.saved = false;
    const observables: ReturnType<typeof this.configSvc.updateValor>[] = [];

    for (const clave of Object.keys(this.params)) {
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
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar algunos valores.' });
      },
      complete: () => {
        this.saving = false;
        this.saved = true;
        this.appConfigSvc.refresh();
        this.estadoActualizacion.configuracionCambio();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Configuración guardada correctamente.' });
        setTimeout(() => { this.saved = false; }, 3000);
      }
    });
  }

  descartar() {
    for (const clave of Object.keys(this.paramsMeta)) {
      this.params[clave] = this.paramsMeta[clave].valor || '';
    }
  }

  getParam(clave: string): string {
    return this.params[clave] || '';
  }

  getParamMeta(clave: string): ParametroResponse | undefined {
    return this.paramsMeta[clave];
  }

  get logosrc(): string {
    return this.logoPreview || this.params['hotel.logo'] || '';
  }

  onLogoSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Solo se permiten imagenes'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('La imagen no debe superar los 2MB'); return; }
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
        }
      },
      error: (err) => { this.uploadingLogo = false; alert(err.error?.message || 'Error al subir logo'); }
    });
  }
}
