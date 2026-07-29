import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../observable/auth.service';
import { UsuarioService } from '../../../observable/usuario.service';
import { Router } from '@angular/router';
import { EstadoActualizacionService } from '../../../services/estado-actualizacion.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private estadoActualizacion = inject(EstadoActualizacionService);

  usuario: any = {};
  loading = true;
  editing = false;
  saving = false;
  editData = { nombreCompleto: '', email: '', telefono: '' };

  showPasswordModal = false;
  passData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  changingPassword = false;

  uploadingAvatar = false;

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    const id = this.authService.getUserId();
    if (!id) { this.router.navigate(['/login']); return; }
    this.usuarioService.obtenerPorId(id).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.usuario = res.data;
          this.authService.actualizarPerfilSesion(res.data);
          this.estadoActualizacion.usuarioCambio({ userId: id });
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  iniciarEdicion(): void {
    this.editData = {
      nombreCompleto: this.usuario.nombreCompleto || '',
      email: this.usuario.email || '',
      telefono: this.usuario.telefono || ''
    };
    this.editing = true;
  }

  cancelarEdicion(): void {
    this.editing = false;
  }

  guardarPerfil(): void {
    this.saving = true;
    const id = this.authService.getUserId();
    this.usuarioService.updateProfile(id, this.editData).subscribe({
      next: res => {
        this.saving = false;
        if (res.success && res.data) {
          this.usuario = res.data;
          this.editing = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Perfil actualizado exitosamente' });
        }
      },
      error: () => { this.saving = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar perfil' }); }
    });
  }

  abrirPasswordModal(): void {
    this.passData = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.showPasswordModal = true;
  }

  cerrarPasswordModal(): void {
    this.showPasswordModal = false;
  }

  cambiarPassword(): void {
    if (this.passData.newPassword !== this.passData.confirmPassword) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Las contrasenas no coinciden' });
      return;
    }
    if (this.passData.newPassword.length < 6) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La contrasena debe tener al menos 6 caracteres' });
      return;
    }
    this.changingPassword = true;
    const id = this.authService.getUserId();
    this.usuarioService.cambiarPassword(id, this.passData.currentPassword, this.passData.newPassword).subscribe({
      next: res => {
        this.changingPassword = false;
        if (res.success) {
          this.showPasswordModal = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Contrasena cambiada exitosamente' });
        }
      },
      error: () => { this.changingPassword = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cambiar contrasena' }); }
    });
  }

  onAvatarSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Solo se permiten imagenes' }); return; }
    if (file.size > 2 * 1024 * 1024) { this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La imagen no debe superar los 2MB' }); return; }
    this.uploadingAvatar = true;
    const id = this.authService.getUserId();
    this.usuarioService.uploadAvatar(id, file).subscribe({
      next: res => {
        this.uploadingAvatar = false;
        if (res.success && res.data) {
          this.usuario.fotoPerfil = res.data.fotoPerfil;
          this.authService.actualizarPerfilSesion({ fotoPerfil: res.data.fotoPerfil });
          this.estadoActualizacion.usuarioCambio({ userId: id });
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Foto de perfil actualizada' });
        }
      },
      error: () => { this.uploadingAvatar = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al subir foto' }); }
    });
  }

  get fotoPerfilSrc(): string { return this.usuario.fotoPerfil || ''; }

  get iniciales(): string {
    return (this.usuario.nombreCompleto || '').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  get avatarColor(): string {
    const colors: Record<string, string> = { ADMIN: '#1a73e8', RECEPCIONISTA: '#34a853', GERENTE: '#ea4335', SUPERVISOR: '#fbbc04' };
    return colors[this.usuario.rol] || '#6c757d';
  }

  get rolLabel(): string {
    return this.usuario.rol === 'ADMIN' ? 'Administrador' : 'Recepcionista';
  }
}
