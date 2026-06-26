import { Routes } from '@angular/router';
import { AuthGuard, AdminGuard } from './guard/auth.guard';
import { Dashboard } from './page/auth/dashboard/dashboard';
import { UsuariosComponent } from './page/auth/usuarios/usuarios.component';
import { HabitacionesComponent } from './page/auth/habitaciones/habitaciones.component';
import { ReservasComponent } from './page/auth/reservas/reservas.component';
import { HospedajesComponent } from './page/auth/hospedajes/hospedajes.component';
import { PagosComponent } from './page/auth/pagos/pagos.component';
import { IncidenciasComponent } from './page/auth/incidencias/incidencias.component';
import { ReportesComponent } from './page/auth/reportes/reportes.component';
import { Login } from './page/auth/login/login';
import { AccessDenied } from './page/auth/access-denied/access-denied';
import { Admin } from './page/auth/admin/admin';
import { Clientes } from './page/auth/clientes/clientes';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'access-denied', component: AccessDenied },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },

  // Recepcionista panel
  {
    path: 'recepcion',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'clientes', component: Clientes },
      { path: 'reservas', component: ReservasComponent },
      { path: 'hospedajes', component: HospedajesComponent },
      { path: 'pagos', component: PagosComponent },
      { path: 'incidencias', component: IncidenciasComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Admin panel
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      { path: 'dashboard', component: Admin },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'habitaciones', component: HabitacionesComponent },
      { path: 'reportes', component: ReportesComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },  

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
