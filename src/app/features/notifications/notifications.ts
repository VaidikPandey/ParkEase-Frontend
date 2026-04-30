import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { Notification } from '../../core/models/parking.models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="max-width:700px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header -->
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <h1 style="font-size:22px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.3px;">Notifications</h1>
          <p style="font-size:13px;color:#71767b;margin:0;">{{ unread() }} unread</p>
        </div>
        @if (unread() > 0) {
          <button (click)="markAllRead()"
                  style="padding:9px 18px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                  onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
            Mark all read
          </button>
        }
      </div>

      @if (loading()) {
        <div style="display:flex;flex-direction:column;gap:1px;">
          @for (i of [1,2,3,4]; track i) {
            <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:12px;height:80px;margin-bottom:8px;animation:pulse 1.5s ease-in-out infinite;"></div>
          }
        </div>
      } @else if (notifications().length === 0) {
        <!-- Empty state -->
        <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:64px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;" class="anim-in anim-d1">
          <div style="width:56px;height:56px;border-radius:50%;background:rgba(29,155,240,.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
            </svg>
          </div>
          <p style="font-size:15px;font-weight:700;color:#e7e9ea;margin:0 0 6px;">All caught up</p>
          <p style="font-size:13px;color:#71767b;margin:0;">No notifications yet.</p>
        </div>
      } @else {
        <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">
          @for (n of notifications(); track n.notificationId; let last = $last) {
            <div style="display:flex;align-items:flex-start;gap:14px;padding:16px 20px;transition:background 120ms ease;cursor:default;"
                 [style.border-bottom]="last ? 'none' : '1px solid rgba(255,255,255,.04)'"
                 [style.background]="n.isRead ? 'transparent' : 'rgba(29,155,240,.03)'"
                 onmouseenter="this.style.background='rgba(255,255,255,.03)'"
                 onmouseleave="this.style.background=this.dataset['read']==='true'?'transparent':'rgba(29,155,240,.03)'"
                 [attr.data-read]="n.isRead">
              <!-- Unread dot -->
              <div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:5px;"
                   [style.background]="n.isRead ? 'rgba(255,255,255,.12)' : '#1d9bf0'"></div>
              <!-- Content -->
              <div style="flex:1;min-width:0;">
                <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0 0 3px;">{{ n.title }}</p>
                <p style="font-size:13px;color:#71767b;margin:0 0 6px;line-height:1.5;">{{ n.message }}</p>
                <p style="font-size:11px;color:#536471;margin:0;">{{ n.sentAt | date:'dd MMM yyyy, h:mm a' }}</p>
              </div>
              <!-- Actions -->
              <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                @if (!n.isRead) {
                  <button (click)="markRead(n.notificationId)"
                          style="font-size:12px;color:#1d9bf0;background:none;border:none;cursor:pointer;font-weight:600;white-space:nowrap;padding:0;transition:opacity 150ms;"
                          onmouseenter="this.style.opacity='.7'" onmouseleave="this.style.opacity='1'">
                    Mark read
                  </button>
                }
                <button (click)="remove(n.notificationId)"
                        style="background:none;border:none;cursor:pointer;color:#536471;padding:4px;border-radius:6px;transition:color 150ms,background 150ms;display:flex;align-items:center;"
                        onmouseenter="this.style.color='#f4212e';this.style.background='rgba(244,33,46,.08)'"
                        onmouseleave="this.style.color='#536471';this.style.background='transparent'">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  private svc   = inject(NotificationService);
  private toast = inject(ToastService);

  notifications = signal<Notification[]>([]);
  loading = signal(true);
  unread  = signal(0);

  ngOnInit() {
    this.svc.getMyNotifications().subscribe({
      next: n => {
        this.notifications.set(n);
        this.unread.set(n.filter(x => !x.isRead).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  markRead(id: number) {
    this.svc.markRead(id).subscribe(() => {
      this.notifications.update(n => n.map(x => x.notificationId === id ? { ...x, isRead: true } : x));
      this.unread.update(c => Math.max(0, c - 1));
      this.svc.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllRead() {
    this.svc.markAllRead().subscribe(() => {
      this.notifications.update(n => n.map(x => ({ ...x, isRead: true })));
      this.unread.set(0);
      this.svc.unreadCount.set(0);
      this.toast.success('All notifications marked as read.');
    });
  }

  remove(id: number) {
    this.svc.delete(id).subscribe(() => {
      const n = this.notifications().find(x => x.notificationId === id);
      if (n && !n.isRead) { this.unread.update(c => Math.max(0, c - 1)); this.svc.unreadCount.update(c => Math.max(0, c - 1)); }
      this.notifications.update(list => list.filter(x => x.notificationId !== id));
    });
  }
}
