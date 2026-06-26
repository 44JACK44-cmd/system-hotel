import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PagoService } from '../../../observable/pago.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {
  private pagoService = inject(PagoService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  pagos: any[] = [];
  filteredPagos: any[] = [];
  loading = false;
  dialogVisible = false;
  searchTerm = '';

  tipos = [
    { label: 'Adelanto', value: 'ADELANTO' },
    { label: 'Saldo', value: 'SALDO' },
    { label: 'Extension', value: 'EXTENSION' }
  ];
  metodos = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Yape', value: 'YAPE' }
  ];

  pagoForm = this.fb.group({
    tipo: ['SALDO', Validators.required],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    metodo: ['EFECTIVO', Validators.required],
    referencia: [''],
    reservaId: [null],
    hospedajeId: [null],
    observacion: ['']
  });

  ngOnInit(): void { this.loadPagos(); }

  getPagoBadge(tipo: string): string {
    const map: Record<string, string> = {
      ADELANTO: 'badge-info',
      SALDO: 'badge-success',
      EXTENSION: 'badge-confirmed'
    };
    return map[tipo] || 'badge-info';
  }

  loadPagos(): void {
    this.loading = true;
    this.pagoService.listarTodos().subscribe({ next: res => { this.pagos = res.data || []; this.filteredPagos = [...this.pagos]; this.loading = false; }, error: () => this.loading = false });
  }

  filter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) { this.filteredPagos = [...this.pagos]; return; }
    this.filteredPagos = this.pagos.filter(p =>
      (p.id?.toString() || '').includes(term) ||
      (p.tipo || '').toLowerCase().includes(term) ||
      (p.metodo || '').toLowerCase().includes(term) ||
      (p.referencia || '').toLowerCase().includes(term) ||
      (p.usuarioNombre || '').toLowerCase().includes(term)
    );
  }

  showDialog(): void {
    this.pagoForm.reset({ tipo: 'SALDO', metodo: 'EFECTIVO', monto: 0 });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.pagoForm.invalid) return;
    this.loading = true;
    this.pagoService.registrar(this.pagoForm.value).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Pago registrado' }); this.dialogVisible = false; this.loading = false; this.loadPagos(); },
      error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
    });
  }
}
