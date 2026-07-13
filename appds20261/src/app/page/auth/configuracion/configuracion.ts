import { Component } from '@angular/core';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion {
  activeTab = 'datos-hotel';

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }
}
