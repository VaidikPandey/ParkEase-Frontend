import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

interface AdminUser { userId: number; fullName: string; email: string; role: string; isActive: boolean; }

@Component({
  selector: 'app-send-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(16px)' }), animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))])])
  ],
  template: `
    <div class="p-6 space-y-6 page-host" @fadeUp>
      <div>
        <h2 style="font-size:22px;font-weight:700;color:var(--text-primary);margin:0;">Send Notification</h2>
        <p style="color:var(--text-secondary);font-size:14px;margin:4px 0 0;">Broadcast messages to platform users</p>
      </div>

      <div class="card p-6 space-y-5" style="max-width:620px;">

        <!-- Audience -->
        <div>
          <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);margin:0 0 10px;">Audience</p>
          <div class="grid grid-cols-3 gap-2">
            @for (a of audiences; track a.value) {
              <button (click)="audience = a.value"
                      class="py-3 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1"
                      [style.background]="audience === a.value ? 'var(--accent-dim)' : 'var(--bg-hover)'"
                      [style.border]="'1px solid ' + (audience === a.value ? 'var(--accent)' : 'var(--border)')"
                      [style.color]="audience === a.value ? 'var(--accent)' : 'var(--text-secondary)'"
                      style="cursor:pointer;outline:none;">
                <span [innerHTML]="a.icon" style="display:flex;"></span>
                {{ a.label }}
              </button>
            }
          </div>
        </div>

        <!-- Type -->
        <div>
          <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);margin:0 0 10px;">Type</p>
          <div class="grid grid-cols-2 gap-2">
            @for (t of notifTypes; track t.value) {
              <button (click)="notifType = t.value"
                      class="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all text-left"
                      [style.background]="notifType === t.value ? 'var(--bg-hover)' : 'transparent'"
                      [style.border]="'1px solid ' + (notifType === t.value ? 'var(--accent)' : 'var(--border)')"
                      [style.color]="notifType === t.value ? 'var(--text-primary)' : 'var(--text-secondary)'"
                      style="cursor:pointer;outline:none;">
                {{ t.label }}
              </button>
            }
          </div>
        </div>

        <!-- Title -->
        <div class="floating-group">
          <input [(ngModel)]="title" type="text" id="ntitle" placeholder=" "/>
          <label for="ntitle">Title *</label>
        </div>

        <!-- Message -->
        <div style="position:relative;">
          <textarea [(ngModel)]="message" id="nmsg" placeholder=" " rows="4"
                    class="w-full px-4 pt-5 pb-3 rounded-xl text-sm resize-none"
                    style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;font-family:inherit;"></textarea>
          <label for="nmsg" style="position:absolute;left:16px;font-size:13px;color:var(--text-secondary);pointer-events:none;transition:all 150ms ease;"
                 [style.top]="message ? '6px' : '14px'"
                 [style.font-size]="message ? '11px' : '13px'">Message *</label>
        </div>

        <!-- Recipient count estimate -->
        @if (recipientCount() !== null) {
          <div class="flex items-center gap-2 px-4 py-3 rounded-xl"
               style="background:var(--bg-secondary);border:1px solid var(--border);">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
            </svg>
            <span style="font-size:13px;color:var(--text-secondary);">
              Will be sent to <strong style="color:var(--text-primary);">{{ recipientCount() }}</strong> user{{ recipientCount() !== 1 ? 's' : '' }}
            </span>
          </div>
        }

        <button (click)="send()" [disabled]="sending()"
                class="btn-accent w-full flex items-center justify-center gap-2"
                [style.opacity]="sending() ? '.6' : '1'">
          @if (sending()) {
            <svg class="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            Sending…
          } @else {
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
            </svg>
            Send Notification
          }
        </button>
      </div>
    </div>
  `
})
export class SendNotificationComponent implements OnInit {
  private svc   = inject(NotificationService);
  private toast = inject(ToastService);
  private http  = inject(HttpClient);

  audiences = [
    {
      label: 'All Users', value: 'ALL',
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>`
    },
    {
      label: 'Drivers', value: 'DRIVER',
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`
    },
    {
      label: 'Managers', value: 'MANAGER',
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>`
    },
  ];

  notifTypes = [
    { label: 'General / System', value: 'SYSTEM' },
    { label: 'Booking', value: 'BOOKING' },
    { label: 'Payment', value: 'PAYMENT' },
    { label: 'Expiry Alert', value: 'EXPIRY' },
  ];

  audience  = 'ALL';
  notifType = 'SYSTEM';
  title     = '';
  message   = '';
  sending   = signal(false);
  allUsers  = signal<AdminUser[]>([]);
  loaded    = signal(false);

  ngOnInit() {
    this.http.get<AdminUser[]>('/api/v1/admin/users').subscribe({
      next: u => { this.allUsers.set(u); this.loaded.set(true); },
      error: () => this.loaded.set(true)
    });
  }

  recipientCount = () => {
    if (!this.loaded()) return null;
    const users = this.allUsers().filter(u => u.isActive);
    if (this.audience === 'ALL') return users.length;
    return users.filter(u => u.role === this.audience).length;
  };

  send() {
    if (!this.title.trim() || !this.message.trim()) {
      this.toast.error('Title and message are required.');
      return;
    }
    const users = this.allUsers().filter(u => u.isActive);
    const targets = this.audience === 'ALL' ? users : users.filter(u => u.role === this.audience);
    if (!targets.length) { this.toast.error('No active users in that audience.'); return; }

    this.sending.set(true);
    this.svc.sendBulk({
      recipientIds: targets.map(u => u.userId),
      title:        this.title,
      message:      this.message,
      type:         this.notifType,
      channel:      'APP',
    }).subscribe({
      next: () => {
        this.toast.success(`Notification sent to ${targets.length} user${targets.length !== 1 ? 's' : ''}.`);
        this.title   = '';
        this.message = '';
        this.sending.set(false);
      },
      error: err => {
        this.toast.error(err?.error?.message ?? 'Failed to send notification.');
        this.sending.set(false);
      }
    });
  }
}
