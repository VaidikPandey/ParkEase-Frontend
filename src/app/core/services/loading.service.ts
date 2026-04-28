import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  active = signal(false);

  start() { this.count++; this.active.set(true); }
  stop()  { this.count = Math.max(0, this.count - 1); if (!this.count) this.active.set(false); }
}
