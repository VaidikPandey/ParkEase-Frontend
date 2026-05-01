import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/parking.models';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

const PAGE_META: Record<string, { title: string }> = {
  '/dashboard':         { title: 'Dashboard' },
  '/slots':             { title: 'Parking Slots' },
  '/vehicle':           { title: 'Vehicle Panel' },
  '/analytics':         { title: 'Analytics' },
  '/bookings':          { title: 'Bookings' },
  '/notifications':     { title: 'Notifications' },
  '/profile':           { title: 'Profile' },
  '/users':             { title: 'User Management' },
  '/send-notification': { title: 'Send Notification' },
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, ClickOutsideDirective],
  styles: [`
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px) scale(.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    .notif-panel { animation: slideDown 180ms cubic-bezier(.4,0,.2,1) forwards; }
  `],
  template: `
    <header class="h-[64px] flex items-center justify-between px-6 bg-bg/80 backdrop-blur-2xl border-b border-border shrink-0 sticky top-0 z-40 relative overflow-visible">

      <!-- Grid Background -->
      <div class="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
           style="background-image:linear-gradient(to right,var(--text-primary) 1px,transparent 1px),linear-gradient(to bottom,var(--text-primary) 1px,transparent 1px);
                  background-size:24px 24px;
                  mask-image:linear-gradient(to right,transparent 0%,black 15%,black 85%,transparent 100%);
                  -webkit-mask-image:linear-gradient(to right,transparent 0%,black 15%,black 85%,transparent 100%);">
      </div>

      <!-- Page title -->
      <div class="flex items-center gap-3 relative z-10">
        <h2 class="text-[18px] font-extrabold text-text-primary m-0 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-md">
          {{ pageTitle() }}
        </h2>
        @if (isLive()) {
          <span class="flex items-center gap-1.5 text-[10px] font-extrabold text-success tracking-widest uppercase bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
            <span class="w-1.5 h-1.5 rounded-full bg-success pulse-dot"></span>Live
          </span>
        }
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-4 relative z-10">

        <!-- Notification bell with dropdown -->
        <div class="relative" (clickOutside)="closePanel()">
          <button (click)="togglePanel()"
                  class="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group"
                  [style.background]="panelOpen() ? 'var(--bg-hover)' : 'transparent'"
                  style="border:1px solid transparent;cursor:pointer;"
                  onmouseenter="this.style.background='var(--bg-hover)';this.style.borderColor='rgba(255,255,255,.05)'"
                  onmouseleave="if(!this.classList.contains('open'))this.style.background='';this.style.borderColor='transparent'">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="2"
                 style="transition:transform 300ms ease;" [style.transform]="panelOpen() ? 'rotate(-15deg)' : 'none'">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
            </svg>
            @if (unread() > 0) {
              <span class="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-extrabold flex items-center justify-center px-1 border-2 border-bg shadow-[0_0_8px_rgba(239,68,68,.6)]">
                {{ unread() > 9 ? '9+' : unread() }}
              </span>
            }
          </button>

          <!-- Notification panel -->
          @if (panelOpen()) {
            <div class="notif-panel absolute right-0 top-[calc(100%+8px)] w-[360px] rounded-2xl overflow-hidden z-50"
                 style="background:var(--bg-primary);border:1px solid var(--border);box-shadow:0 24px 60px rgba(0,0,0,.5);">

              <!-- Panel header -->
              <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid var(--border);">
                <div class="flex items-center gap-2">
                  <span style="font-size:14px;font-weight:800;color:var(--text-primary);">Notifications</span>
                  @if (unread() > 0) {
                    <span style="font-size:11px;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(239,68,68,.12);color:#ef4444;">
                      {{ unread() }} new
                    </span>
                  }
                </div>
                @if (unread() > 0) {
                  <button (click)="markAllRead()" style="font-size:12px;color:var(--accent);background:none;border:none;cursor:pointer;font-weight:600;padding:0;">
                    Mark all read
                  </button>
                }
              </div>

              <!-- Notification list -->
              <div style="max-height:380px;overflow-y:auto;">
                @if (loadingPanel()) {
                  @for (i of [1,2,3]; track i) {
                    <div style="padding:14px 16px;border-bottom:1px solid var(--border);">
                      <div style="height:12px;background:var(--bg-hover);border-radius:6px;margin-bottom:6px;width:70%;animation:pulse 1.5s infinite;"></div>
                      <div style="height:10px;background:var(--bg-hover);border-radius:6px;width:90%;animation:pulse 1.5s infinite;"></div>
                    </div>
                  }
                } @else if (recentNotifs().length === 0) {
                  <div style="padding:40px 16px;text-align:center;">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.5" style="margin:0 auto 10px;display:block;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
                    </svg>
                    <p style="font-size:13px;color:var(--text-secondary);margin:0;">All caught up!</p>
                  </div>
                } @else {
                  @for (n of recentNotifs(); track n.notificationId) {
                    <div (click)="markRead(n)" style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;cursor:pointer;transition:background 120ms;"
                         [style.background]="n.isRead ? 'transparent' : 'rgba(29,155,240,.04)'"
                         [style.border-bottom]="'1px solid var(--border)'"
                         onmouseenter="this.style.background='var(--bg-hover)'"
                         onmouseleave="this.style.background=this.dataset['read']==='true'?'transparent':'rgba(29,155,240,.04)'"
                         [attr.data-read]="n.isRead">
                      <!-- Dot -->
                      <div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:5px;"
                           [style.background]="n.isRead ? 'var(--border)' : '#1d9bf0'"></div>
                      <!-- Content -->
                      <div style="flex:1;min-width:0;">
                        <p style="font-size:13px;font-weight:700;color:var(--text-primary);margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ n.title }}</p>
                        <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ n.message }}</p>
                        <p style="font-size:11px;color:var(--text-tertiary, #536471);margin:0;">{{ timeAgo(n.sentAt) }}</p>
                      </div>
                    </div>
                  }
                }
              </div>

              <!-- View all footer -->
              <div style="border-top:1px solid var(--border);padding:10px 16px;text-align:center;">
                <a routerLink="/notifications" (click)="closePanel()"
                   style="font-size:13px;font-weight:600;color:var(--accent);text-decoration:none;display:block;padding:4px;">
                  View all notifications
                </a>
              </div>
            </div>
          }
        </div>

      </div>
    </header>
  `
})
export class TopbarComponent implements OnInit, OnDestroy {
  private auth      = inject(AuthService);
  private notif     = inject(NotificationService);
  private router    = inject(Router);
  private destroy$  = new Subject<void>();

  pageTitle     = signal('Dashboard');
  panelOpen     = signal(false);
  loadingPanel  = signal(false);
  recentNotifs  = signal<Notification[]>([]);
  unread        = this.notif.unreadCount;

  isLive = computed(() => {
    const t = this.pageTitle();
    return t === 'Dashboard' || t === 'Analytics';
  });

  ngOnInit() {
    this.setTitle(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: any) => {
      this.setTitle(e.urlAfterRedirects ?? e.url);
      this.closePanel();
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  togglePanel() {
    if (this.panelOpen()) { this.closePanel(); return; }
    this.panelOpen.set(true);
    this.loadingPanel.set(true);
    this.notif.getMyNotifications().subscribe({
      next: notifs => {
        this.recentNotifs.set(notifs.slice(0, 10));
        this.loadingPanel.set(false);
      },
      error: () => this.loadingPanel.set(false)
    });
  }

  closePanel() { this.panelOpen.set(false); }

  markRead(n: Notification) {
    if (n.isRead) return;
    this.notif.markRead(n.notificationId).subscribe(() => {
      this.recentNotifs.update(list => list.map(x => x.notificationId === n.notificationId ? { ...x, isRead: true } : x));
      this.notif.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllRead() {
    this.notif.markAllRead().subscribe(() => {
      this.recentNotifs.update(list => list.map(x => ({ ...x, isRead: true })));
      this.notif.unreadCount.set(0);
    });
  }

  timeAgo(sentAt: string): string {
    if (!sentAt) return '';
    const now  = Date.now();
    const then = new Date(sentAt.endsWith('Z') ? sentAt : sentAt + 'Z').getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  private setTitle(url: string) {
    const base = '/' + url.split('/')[1];
    this.pageTitle.set(PAGE_META[base]?.title ?? 'ParkEase');
  }
}
