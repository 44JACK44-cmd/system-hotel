import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../observable/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  // Removed PrimeNG ButtonModule/PasswordModule — replaced by native HTML in new template
  imports: [ToastModule, CommonModule, ReactiveFormsModule],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loading = false;
  showPassword = false;

  /** Reactive signal — updated every second */
  fechaHoraActual = signal<string>('');
  private intervalId: any;

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    this.actualizarFechaHora();
    this.intervalId = setInterval(() => this.actualizarFechaHora(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private actualizarFechaHora(): void {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-PE', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
    const hora = ahora.toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
    this.fechaHoraActual.set(`${fecha}  •  ${hora}`);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.authService.login(this.loginForm.value as any).subscribe({
      next: () => {
        const rol = this.authService.getRol();
        this.router.navigate([rol === 'ADMIN' ? '/admin/dashboard' : '/recepcion/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Credenciales incorrectas';
        this.messageService.add({ severity: 'error', summary: 'Error de acceso', detail: msg });
      }
    });
  }
}
