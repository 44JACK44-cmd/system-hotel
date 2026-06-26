import { Component, inject } from '@angular/core';
import { AuthService } from '../../../observable/auth.service';
import { Card } from "primeng/card";
import { Divider } from "primeng/divider";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [Card, Divider, RouterModule],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.css',
})
export class AccessDenied {
   private authService = inject(AuthService);
  dashboardRoute = this.authService.isAdmin() ? '/admin/dashboard' : '/recepcion/dashboard';
}
