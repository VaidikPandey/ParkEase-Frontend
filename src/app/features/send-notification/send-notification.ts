import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

interface AdminUser { userId: number; fullName: string; email: string; role: string; isActive: boolean; }

@Component({
  selector: 'app-send-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width:640px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header -->
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);">
        <h1 style="font-size:22px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.3px;">Send Notification</h1>
        <p style="font-size:13px;color:#71767b;margin:0;">Broadcast messages to platform users</p>
      </div>

      <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">

        <!-- Audience -->
        <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
          <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#71767b;margin:0 0 12px;">Audience</p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
            @for (a of audiences; track a.value) {
              <button (click)="audience = a.value"
                      style="padding:14px 8px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;display:flex;flex-direction:column;align-items:center;gap:6px;"
                      [style.background]="audience === a.value ? 'rgba(29,155,240,.1)' : 'rgba(255,255,255,.03)'"
                      [style.border]="'1px solid ' + (audience === a.value ? 'rgba(29,155,240,.4)' : 'rgba(255,255,255,.07)')"
                      [style.color]="audience === a.value ? '#1d9bf0' : '#71767b'">
                <span [innerHTML]="a.icon" style="display:flex;"></span>
                {{ a.label }}
              </button>
            }
          </div>
        </div>

        <!-- Type -->
        <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
          <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#71767b;margin:0 0 12px;">Type</p>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
            @for (t of notifTypes; track t.value) {
              <button (click)="notifType = t.value"
                      style="padding:10px 14px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;text-align:left;"
                      [style.background]="notifType === t.value ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)'"
                      [style.border]="'1px solid ' + (notifType === t.value ? 'rgba(29,155,240,.4)' : 'rgba(255,255,255,.06)')"
                      [style.color]="notifType === t.value ? '#e7e9ea' : '#71767b'">
                {{ t.label }}
              </button>
            }
          </div>
        </div>

        <!-- Message form -->
        <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">
          <div>
            <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Title <span style="color:#f4212e;">*</span></label>
            <input [(ngModel)]="title" type="text" placeholder="Notification title"
                   style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                   onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
          </div>
          <div>
            <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Message <span style="color:#f4212e;">*</span></label>
            <textarea [(ngModel)]="message" rows="4" placeholder="Write your message here…"
                      style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;resize:vertical;font-family:inherit;transition:border-color 150ms;"
                      onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"></textarea>
          </div>

          <!-- Recipient count -->
          @if (recipientCount() !== null) {
            <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;background:rgba(29,155,240,.06);border:1px solid rgba(29,155,240,.15);">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
              </svg>
              <span style="font-size:13px;color:#71767b;">
                Will be sent to <strong style="color:#e7e9ea;">{{ recipientCount() }}</strong> user{{ recipientCount() !== 1 ? 's' : '' }}
              </span>
            </div>
          }

          <button (click)="send()" [disabled]="sending()"
                  style="padding:12px;border-radius:12px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;display:flex;align-items:center;justify-content:center;gap:8px;"
                  [style.opacity]="sending() ? '.5' : '1'">
            @if (sending()) {
              <svg style="animation:spin 1s linear infinite;" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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
    { label: 'Booking',          value: 'BOOKING' },
    { label: 'Payment',          value: 'PAYMENT' },
    { label: 'Expiry Alert',     value: 'EXPIRY' },
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
