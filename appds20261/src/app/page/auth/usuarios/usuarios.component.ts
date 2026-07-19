import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../../observable/usuario.service';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageResponse } from '../../../shared/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule, ConfirmDialogModule, SelectModule, ToggleSwitchModule, PaginatorModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, OnDestroy {
  private usuarioService = inject(UsuarioService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  usuarios: any[] = [];
  stats = { total: 0, activos: 0, admins: 0, recepcionistas: 0 };
  loading = false;
  dialogVisible = false;
  editing = false;
  editingId: number | null = null;
  activeTab: 'personal' | 'historial' = 'personal';

  /* Server-side pagination */
  page = 0;
  pageSize = 20;
  totalRecords = 0;
  sortField = '';
  sortDir: 'asc' | 'desc' = 'asc';
  searchTerm = '';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  roles = [
    { label: 'Administrador', value: 'ADMIN' },
    { label: 'Recepcionista', value: 'RECEPCIONISTA' }
  ];

  userForm = this.fb.group({
    nombreCompleto: ['', Validators.required],
    username: ['', Validators.required],
    password: [''],
    rol: ['RECEPCIONISTA', Validators.required]
  });

  switchTab(tab: 'personal' | 'historial'): void { this.activeTab = tab; }

  ngOnInit(): void {
    this.loadStats();
    this.loadUsuarios();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => { this.page = 0; this.loadUsuarios(); });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  loadStats(): void {
    this.usuarioService.listarTodos().subscribe({
      next: (res) => {
        const all = res.data || [];
        this.stats = {
          total: all.length,
          activos: all.filter((u: any) => u.activo).length,
          admins: all.filter((u: any) => u.rol === 'ADMIN').length,
          recepcionistas: all.filter((u: any) => u.rol === 'RECEPCIONISTA').length
        };
      }
    });
  }

  loadUsuarios(): void {
    this.loading = true;
    this.usuarioService.listarPaginado(this.page, this.pageSize, this.sortField || undefined, this.sortDir, this.searchTerm || undefined).subscribe({
      next: (res: PageResponse<any>) => {
        this.usuarios = res.content;
        this.totalRecords = res.totalElements;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onPageChange(event: any): void {
    this.page = event.page;
    this.pageSize = event.rows;
    this.loadUsuarios();
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.page = 0;
    this.loadUsuarios();
  }

  showDialog(): void {
    this.editing = false;
    this.editingId = null;
    this.userForm.reset({ rol: 'RECEPCIONISTA' });
    this.userForm.get('password')?.setValidators(Validators.required);
    this.dialogVisible = true;
  }

  editUser(u: any): void {
    this.editing = true;
    this.editingId = u.id;
    this.userForm.patchValue({ nombreCompleto: u.nombreCompleto, username: u.username, rol: u.rol });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.dialogVisible = true;
  }

  save(): void {
    if (this.userForm.invalid) return;
    this.loading = true;
    const data = this.userForm.value;
    if (this.editing && this.editingId) {
      this.usuarioService.actualizar(this.editingId, data).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Usuario actualizado' }); this.dialogVisible = false; this.loading = false; this.loadUsuarios(); },
        error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
      });
    } else {
      this.usuarioService.crear(data).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Usuario creado' }); this.dialogVisible = false; this.loading = false; this.loadUsuarios(); },
        error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
      });
    }
  }

  toggleStatus(u: any): void {
    this.confirmationService.confirm({
      message: `${u.activo ? 'Desactivar' : 'Activar'} usuario ${u.nombreCompleto}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.usuarioService.cambiarEstado(u.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Estado cambiado' }); this.loading = false; this.loadUsuarios(); },
          error: (err) => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }); }
        });
      }
    });
  }
}
