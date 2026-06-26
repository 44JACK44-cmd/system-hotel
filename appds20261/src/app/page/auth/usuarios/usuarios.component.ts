import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../../observable/usuario.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  usuarios: any[] = [];
  loading = false;
  dialogVisible = false;
  editing = false;
  editingId: number | null = null;

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

  ngOnInit(): void { this.loadUsuarios(); }

  loadUsuarios(): void {
    this.loading = true;
    this.usuarioService.listarTodos().subscribe({ next: res => { this.usuarios = res.data || []; this.loading = false; }, error: () => this.loading = false });
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
