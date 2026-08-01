import { Component, inject, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../../observable/pago.service';
import { ReservaService } from '../../observable/reserva.service';
import { HospedajeService } from '../../observable/hospedaje.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LayoutStateService } from '../../services/layout-state.service';
import { EstadoActualizacionService } from '../../services/estado-actualizacion.service';

@Component({
  selector: 'app-pagos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, InputNumberModule, SelectModule, AutoCompleteModule, ToastModule],
  providers: [MessageService],
  templateUrl: './pagos-modal.component.html',
  styleUrl: './pagos-modal.component.css'
})
export class PagosModalComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  private pagoService = inject(PagoService);
  private reservaService = inject(ReservaService);
  private hospedajeService = inject(HospedajeService);
  private messageService = inject(MessageService);
  private layoutState = inject(LayoutStateService);
  private estadoActualizacion = inject(EstadoActualizacionService);

  tipos = [
    { label: 'Adelanto', value: 'ADELANTO' },
    { label: 'Saldo', value: 'SALDO' },
    { label: 'Extensión', value: 'EXTENSION' }
  ];
  metodos = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Yape', value: 'YAPE' }
  ];

  tipo = 'SALDO';
  monto = 0;
  metodo = 'EFECTIVO';
  referencia = '';
  reservaId: number | null = null;
  hospedajeId: number | null = null;
  loading = false;

  reservasBuscadas: any[] = [];
  hospedajesBuscados: any[] = [];
  reservaObj: any = null;
  hospedajeObj: any = null;

  puedeGuardar(): boolean {
    return this.monto > 0 && this.monto <= 99999999.99;
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;
    this.loading = true;
    this.pagoService.registrar({
      tipo: this.tipo,
      monto: this.monto,
      metodo: this.metodo,
      referencia: this.referencia?.trim() || undefined,
      reservaId: this.reservaId || undefined,
      hospedajeId: this.hospedajeId || undefined
    }).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pago registrado correctamente' });
        this.estadoActualizacion.pagoCambio();
        this.estadoActualizacion.hospedajeCambio();
        this.estadoActualizacion.reservaCambio();
        setTimeout(() => this.cerrar(), 1000);
      },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.listMessage?.[0] || err.error?.message || 'Error al registrar pago' }); }
    });
  }

  ngOnInit(): void {
    this.layoutState.setOverlay(true);
  }

  ngOnDestroy(): void {
    this.layoutState.setOverlay(false);
  }

  buscarReservas(event: any): void {
    const query = event.query?.trim();
    if (!query || query.length < 2) { this.reservasBuscadas = []; return; }
    this.reservaService.search(query).subscribe({
      next: res => {
        const data = res.data || [];
        this.reservasBuscadas = data.map((r: any) => ({
          ...r,
          label: `#${r.id} - ${r.clienteNombre || ''} (${r.fechaEntrada ? r.fechaEntrada.substring(0,10) : ''})`
        }));
      },
      error: () => this.reservasBuscadas = []
    });
  }

  onReservaSelect(event: any): void {
    this.reservaId = event?.value?.id || null;
  }

  buscarHospedajes(event: any): void {
    const query = event.query?.trim();
    if (!query || query.length < 2) { this.hospedajesBuscados = []; return; }
    this.hospedajeService.search(query).subscribe({
      next: res => {
        const data = res.data || [];
        this.hospedajesBuscados = data.map((h: any) => ({
          ...h,
          label: `#${h.id} - ${h.clienteNombre || ''} - Hab ${h.habitacionNumero || ''}`
        }));
      },
      error: () => this.hospedajesBuscados = []
    });
  }

  onHospedajeSelect(event: any): void {
    this.hospedajeId = event?.value?.id || null;
  }

  cerrar(): void {
    this.monto = 0;
    this.referencia = '';
    this.reservaId = null;
    this.hospedajeId = null;
    this.reservaObj = null;
    this.hospedajeObj = null;
    this.reservasBuscadas = [];
    this.hospedajesBuscados = [];
    this.layoutState.setOverlay(false);
    this.close.emit();
  }
}
