import { Component, inject, NgZone, OnDestroy, OnInit, effect } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../observable/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { Ripple } from 'primeng/ripple';
import { CommonModule } from '@angular/common';
import { AppConfigService } from '../../../services/app-config.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ToastModule, CommonModule, ReactiveFormsModule, InputTextModule, Ripple],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private zone = inject(NgZone);
  private appConfig = inject(AppConfigService);
  protected cfg = this.appConfig.config;

  constructor() {
    effect(() => {
      const c = this.cfg();
      document.title = c.nombre ? `${c.nombre} — ${c.ciudad || 'Iniciar Sesión'}` : 'Iniciar Sesión';
    });
  }

  loading = false;
  showPassword = false;
  headerRevealed = false;
  formRevealed = false;
  footerRevealed = false;
  private revealTimers: ReturnType<typeof setTimeout>[] = [];

  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.revealTimers = [
      setTimeout(() => { this.headerRevealed = true; }, 100),
      setTimeout(() => { this.formRevealed = true; }, 500),
      setTimeout(() => { this.footerRevealed = true; }, 1200),
    ];
  }

  ngOnDestroy(): void {
    this.revealTimers.forEach(t => clearTimeout(t));
  }

  forgotPassword(): void {
    this.messageService.add({ severity: 'info', summary: 'Recuperar clave', detail: 'Contacte al administrador del sistema para restablecer su contraseña.' });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.authService.login(this.loginForm.value as any).subscribe({
      next: () => {
        const rol = this.authService.getRol();
        this.zone.run(() => {
          this.router.navigate([rol === 'ADMIN' ? '/admin/dashboard' : '/recepcion/dashboard']);
        });
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.listMessage?.[0] || err.error?.message || 'Credenciales incorrectas';
        this.messageService.add({ severity: 'error', summary: 'Error de acceso', detail: msg });
      }
    });
  }
}
