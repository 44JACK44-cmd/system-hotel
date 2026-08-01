import { Component, inject, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../../observable/cliente.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EstadoActualizacionService } from '../../services/estado-actualizacion.service';

@Component({
  selector: 'app-cliente-quick-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './cliente-quick-create.component.html',
  styleUrl: './cliente-quick-create.component.css'
})
export class ClienteQuickCreateComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  @Output() clienteCreado = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private messageService = inject(MessageService);
  private estadoActualizacion = inject(EstadoActualizacionService);

  loading = false;

  clienteForm = this.fb.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60), this.nombreSoloLetras]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{6,12}$/)]],
    documento: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    codigoPais: ['+51', [Validators.pattern(/^\+?[0-9]{1,4}$/)]],
    tipoDocumento: ['DNI']
  });

  private nombreSoloLetras(control: any): { [key: string]: any } | null {
    if (!control.value) return null;
    const v = String(control.value).trim();
    if (/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]/.test(v)) return { letrasInvalidas: true };
    if (/\s{2,}/.test(v)) return { espaciosDobles: true };
    return null;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  guardar(): void {
    if (this.clienteForm.invalid) return;
    const v = this.clienteForm.value;
    const payload: any = {
      nombreCompleto: v.nombreCompleto?.trim().replace(/\s{2,}/g, ' '),
      tipoDocumento: v.tipoDocumento || 'DNI',
      documento: v.documento?.trim() || null,
      telefono: v.telefono?.trim(),
      codigoPais: v.codigoPais?.trim() || '+51',
      email: v.email?.trim().toLowerCase() || null
    };
    this.loading = true;
    this.clienteService.crear(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente creado correctamente' });
        const cliente = res.data;
        this.clienteForm.reset();
        this.estadoActualizacion.clienteCambio({ clienteId: cliente?.id });
        this.clienteCreado.emit(cliente);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 409) {
          const term = this.clienteForm.value.documento || this.clienteForm.value.email || this.clienteForm.value.nombreCompleto || '';
          this.clienteService.buscar(term).subscribe({
            next: (res) => {
              const existente = res.data?.[0];
              if (existente) {
                this.messageService.add({ severity: 'info', summary: 'Cliente existente', detail: 'El cliente ya está registrado. Seleccionando automáticamente.' });
                this.clienteForm.reset();
                this.clienteCreado.emit(existente);
              } else {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El cliente ya existe pero no se pudo encontrar.' });
              }
            },
            error: () => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El cliente ya existe en el sistema.' });
            }
          });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error al crear cliente' });
        }
      }
    });
  }

  cancelar(): void {
    this.clienteForm.reset();
    this.close.emit();
  }
}
