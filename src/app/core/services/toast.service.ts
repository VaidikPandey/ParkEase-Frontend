import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private next = 0;

  show(message: string, type: Toast['type'] = 'info', duration = 3500) {
    const id = ++this.next;
    this.toasts.update(t => [...t, { id, type, message }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string)   { this.show(msg, 'error', 4500); }
  info(msg: string)    { this.show(msg, 'info'); }
  warning(msg: string) { this.show(msg, 'warning'); }

  dismiss(id: number) { this.toasts.update(t => t.filter(x => x.id !== id)); }
}
