import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '../../../observable/configuracion.service';
import { HabitacionService } from '../../../observable/habitacion.service';
import { ParametroResponse, HabitacionResponse } from '../../../shared/models';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
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

  constructor(
    private configSvc: ConfiguracionService,
    private habSvc: HabitacionService
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
    const keys = Object.keys(this.params);
    let completed = 0;
    let hasError = false;

    for (const clave of keys) {
      const meta = this.paramsMeta[clave];
      if (meta && meta.valor !== this.params[clave]) {
        this.configSvc.updateValor(clave, this.params[clave]).subscribe({
          next: (r) => {
            if (r.success && r.data) {
              this.paramsMeta[clave] = r.data;
            }
          },
          error: () => { hasError = true; }
        });
      }
      completed++;
    }

    setTimeout(() => {
      this.saving = false;
      this.saved = true;
      setTimeout(() => { this.saved = false; }, 3000);
    }, 500);
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
}
