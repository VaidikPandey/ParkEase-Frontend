import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { Notification } from '../../core/models/parking.models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(16px)' }), animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))])])
  ],
  template: `
    <div class="p-6 space-y-5 page-host" @fadeUp>
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 style="font-size:22px;font-weight:700;color:var(--text-primary);margin:0;">Notifications</h2>
          <p style="color:var(--text-secondary);font-size:14px;margin:4px 0 0;">{{ unread() }} unread</p>
        </div>
        @if (unread() > 0) {
          <button (click)="markAllRead()"
                  class="btn-accent">Mark all read</button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-2">
          @for (i of [1,2,3,4]; track i) {
            <div class="card p-4 animate-pulse" style="height:70px;"></div>
          }
        </div>
      } @else if (notifications().length === 0) {
        <div class="card p-16 flex flex-col items-center text-center" @fadeUp>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.5" class="mb-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
          </svg>
          <p style="font-size:15px;font-weight:600;color:var(--text-primary);margin:0 0 4px;">All caught up</p>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">No notifications yet.</p>
        </div>
      } @else {
        <div class="space-y-2" @fadeUp>
          @for (n of notifications(); track n.notificationId) {
            <div class="card px-5 py-4 flex items-start gap-4 transition-all"
                 [style.background]="n.isRead ? 'var(--bg-card)' : 'rgba(29,155,240,.04)'"
                 [style.border-color]="n.isRead ? 'var(--border)' : 'rgba(29,155,240,.2)'">
              <div class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                   [style.background]="n.isRead ? 'transparent' : 'var(--accent)'"></div>
              <div class="flex-1">
                <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">{{ n.title }}</p>
                <p style="font-size:13px;color:var(--text-secondary);margin:3px 0 0;line-height:1.5;">{{ n.message }}</p>
                <p style="font-size:11px;color:var(--text-secondary);margin:6px 0 0;opacity:.6;">{{ n.sentAt | date:'dd MMM yyyy, h:mm a' }}</p>
              </div>
              <div class="flex gap-2 flex-shrink-0">
                @if (!n.isRead) {
                  <button (click)="markRead(n.notificationId)"
                          style="font-size:12px;color:var(--accent);background:none;border:none;cursor:pointer;font-weight:600;white-space:nowrap;">
                    Mark read
                  </button>
                }
                <button (click)="remove(n.notificationId)"
                        style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:0;">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
