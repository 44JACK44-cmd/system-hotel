import { Component, inject, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../observable/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  // Removed PrimeNG ButtonModule/PasswordModule — replaced by native HTML in new template
  imports: [ToastModule, CommonModule, ReactiveFormsModule, InputTextModule, PasswordModule, CheckboxModule],
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

  loading = false;

  /** Reactive signal — updated every second */
  fechaActual = signal<string>('');
  horaActual = signal<string>('');
  private intervalId: any;

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false]
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
    const dias = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const meses = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const fecha = `${dias[ahora.getDay()]}, ${meses[ahora.getMonth()]} ${ahora.getDate()}, ${ahora.getFullYear()}`;
    const horas = ahora.getHours();
    const minutos = ahora.getMinutes();
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const h12 = horas % 12 || 12;
    const mStr = minutos < 10 ? '0' + minutos : '' + minutos;
    this.fechaActual.set(fecha);
    this.horaActual.set(`${h12}:${mStr} ${ampm}`);
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
        const msg = err.error?.message || 'Credenciales incorrectas';
        this.messageService.add({ severity: 'error', summary: 'Error de acceso', detail: msg });
      }
    });
  }
}
