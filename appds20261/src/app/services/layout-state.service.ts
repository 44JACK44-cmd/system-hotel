import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutStateService {
  private _overlayCount = signal(0);
  readonly overlayActive = computed(() => this._overlayCount() > 0);

  setOverlay(active: boolean): void {
    if (active) {
      this._overlayCount.update(c => c + 1);
    } else {
      this._overlayCount.update(c => Math.max(0, c - 1));
    }
  }
}
