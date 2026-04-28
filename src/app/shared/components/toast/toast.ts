import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('280ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease', style({ opacity: 0, transform: 'translateX(110%)' }))
      ])
    ])
  ],
  template: `
    <div class="fixed z-[9999] flex flex-col gap-2" style="top:68px;right:20px;min-width:300px;max-width:380px;">
      @for (t of svc.toasts(); track t.id) {
        <div class="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg" @slide
             [style.background]="bg(t.type)"
             [style.border]="'1px solid ' + border(t.type)">
          <div class="flex-shrink-0 mt-0.5" [style.color]="icon(t.type).color">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="icon(t.type).d"/>
            </svg>
          </div>
          <p style="font-size:13px;font-weight:500;margin:0;flex:1;line-height:1.4;"
             [style.color]="icon(t.type).color">{{ t.message }}</p>
          <button (click)="svc.dismiss(t.id)"
                  style="background:none;border:none;cursor:pointer;padding:0;line-height:1;"
                  [style.color]="icon(t.type).color">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  svc = inject(ToastService);

  bg(type: string)     { return type === 'success' ? 'rgba(0,186,124,.1)' : type === 'error' ? 'rgba(244,33,46,.1)' : type === 'warning' ? 'rgba(255,212,0,.1)' : 'rgba(29,155,240,.1)'; }
  border(type: string) { return type === 'success' ? 'rgba(0,186,124,.3)' : type === 'error' ? 'rgba(244,33,46,.3)' : type === 'warning' ? 'rgba(255,212,0,.3)' : 'rgba(29,155,240,.3)'; }
  icon(type: string)   {
    const map: Record<string, { color: string; d: string }> = {
      success: { color: '#00ba7c', d: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      error:   { color: '#f4212e', d: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
      warning: { color: '#ffd400', d: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
      info:    { color: '#1d9bf0', d: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z' },
    };
    return map[type] ?? map['info'];
  }
}
