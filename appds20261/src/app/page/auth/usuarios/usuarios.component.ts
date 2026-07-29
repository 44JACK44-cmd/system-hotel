import { Component, inject, ChangeDetectorRef, ApplicationRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../../observable/usuario.service';
import { AuthService } from '../../../observable/auth.service';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PageResponse } from '../../../shared/models';
import { LayoutStateService } from '../../../services/layout-state.service';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

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
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private layoutState = inject(LayoutStateService);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private estadoActualizacion = inject(EstadoActualizacionService);

  usuarios: any[] = [];
  stats = { total: 0, activos: 0, admins: 0, recepcionistas: 0 };
  loading = false;
  dialogVisible = false;
  editing = false;
  editingId: number | null = null;
  activeTab: 'personal' | 'historial' = 'personal';

  showNewPassword = false;
  showConfirmPassword = false;
  passwordError = '';
  confirmPasswordError = '';
  loadingAction = false;
  actionButtonText = '';

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
    nombreCompleto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.maxLength(50)]],
    email: ['', [Validators.maxLength(100), Validators.email]],
    telefono: ['', [Validators.maxLength(20)]],
    password: ['', [Validators.minLength(6), Validators.maxLength(100)]],
    confirmPassword: [''],
    rol: ['RECEPCIONISTA', Validators.required],
    activo: [true]
  });

  switchTab(tab: 'personal' | 'historial'): void { this.activeTab = tab; }

  ngOnInit(): void {
    this.loadStats();
    this.loadUsuarios();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => { this.page = 0; this.loadUsuarios(); });
    this.estadoActualizacion.on('USUARIO_CAMBIO').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadUsuarios();
      this.loadStats();
    });
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
        this.cdr.detectChanges();
        this.appRef.tick();
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
        this.cdr.detectChanges();
        this.appRef.tick();
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
    this.resetForm();
    this.userForm.reset({ rol: 'RECEPCIONISTA', activo: true });
    this.userForm.get('password')?.setValidators(Validators.required);
    this.userForm.get('password')?.updateValueAndValidity();
    this.dialogVisible = true;
    this.layoutState.setOverlay(true);
  }

  editUser(u: any): void {
    this.editing = true;
    this.editingId = u.id;
    this.resetForm();
    this.userForm.patchValue({
      nombreCompleto: u.nombreCompleto,
      username: u.username,
      email: u.email || '',
      telefono: u.telefono || '',
      rol: u.rol,
      activo: u.activo
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.dialogVisible = true;
    this.layoutState.setOverlay(true);
  }

  resetForm(): void {
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.layoutState.setOverlay(false);
    this.resetForm();
  }

  validatePasswords(): void {
    this.passwordError = '';
    this.confirmPasswordError = '';
    const password = this.userForm.get('password')?.value || '';
    const confirmPassword = this.userForm.get('confirmPassword')?.value || '';

    if (password && !confirmPassword) {
      this.confirmPasswordError = 'Debe confirmar la nueva contraseña';
    } else if (!password && confirmPassword) {
      this.passwordError = 'Debe ingresar la nueva contraseña';
    } else if (password && confirmPassword && password !== confirmPassword) {
      this.confirmPasswordError = 'Las contraseñas no coinciden';
    }
  }

  onPasswordInput(): void {
    this.validatePasswords();
  }

  onConfirmPasswordInput(): void {
    this.validatePasswords();
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  save(): void {
    this.validatePasswords();
    if (this.passwordError || this.confirmPasswordError) return;
    if (this.userForm.invalid) return;

    this.loading = true;
    const data = this.userForm.value;

    // Clean up empty password fields for editing
    if (this.editing && (!data.password || data.password === '')) {
      delete data.password;
      delete data.confirmPassword;
    }

    if (this.editing && this.editingId) {
      this.usuarioService.actualizarCompleto(this.editingId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado' });
          this.dialogVisible = false;
          this.layoutState.setOverlay(false);
          this.loading = false;
          this.loadUsuarios();
          this.loadStats();
          this.estadoActualizacion.usuarioCambio();
        },
        error: (err) => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar' });
        }
      });
    } else {
      this.usuarioService.crear(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado' });
          this.dialogVisible = false;
          this.layoutState.setOverlay(false);
          this.loading = false;
          this.loadUsuarios();
          this.loadStats();
          this.estadoActualizacion.usuarioCambio();
        },
        error: (err) => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear' });
        }
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
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estado cambiado' });
            this.loading = false;
            this.loadUsuarios();
            this.loadStats();
            this.estadoActualizacion.usuarioCambio();
          },
          error: (err) => {
            this.loading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' });
          }
        });
      }
    });
  }

  resetPassword(u: any): void {
    this.confirmationService.confirm({
      message: `¿Restablecer contraseña de ${u.nombreCompleto}? Se requerirá ingresar la nueva contraseña dos veces.`,
      header: 'Restablecer Contraseña',
      icon: 'pi pi-key',
      accept: () => {
        this.actionButtonText = 'Restablecer';
        this.loadingAction = true;
        // We'll use a simple prompt for this demo, but ideally a modal with form
        const newPassword = prompt('Ingrese la nueva contraseña:');
        if (!newPassword) {
          this.loadingAction = false;
          return;
        }
        const confirmPassword = prompt('Confirme la nueva contraseña:');
        if (!confirmPassword) {
          this.loadingAction = false;
          return;
        }
        if (newPassword !== confirmPassword) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden' });
          this.loadingAction = false;
          return;
        }
        this.usuarioService.resetPasswordByAdmin(u.id, newPassword, confirmPassword).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña restablecida' });
            this.loadingAction = false;
          },
          error: (err) => {
            this.loadingAction = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al restablecer' });
          }
        });
      }
    });
  }

  deleteUser(u: any): void {
    this.confirmationService.confirm({
      message: `¿Eliminar usuario ${u.nombreCompleto}? Esta acción desactivará al usuario (soft delete).`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-trash',
      accept: () => {
        this.loading = true;
        this.usuarioService.eliminar(u.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario desactivado' });
            this.loading = false;
            this.loadUsuarios();
            this.loadStats();
            this.estadoActualizacion.usuarioCambio();
          },
          error: (err) => {
            this.loading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al eliminar' });
          }
        });
      }
    });
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
