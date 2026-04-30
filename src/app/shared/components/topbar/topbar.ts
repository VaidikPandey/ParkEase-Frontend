import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

const PAGE_META: Record<string, { title: string; sub?: string }> = {
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
  imports: [CommonModule, RouterLink],
  template: `
    <header class="h-[64px] flex items-center justify-between px-6 bg-bg/80 backdrop-blur-2xl border-b border-border shrink-0 sticky top-0 z-40 relative overflow-hidden">
      
      <!-- Grid Background overlay -->
      <div class="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
           style="background-image: linear-gradient(to right, var(--text-primary) 1px, transparent 1px),
                                    linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px);
                  background-size: 24px 24px;
                  mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
                  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);">
      </div>

      <!-- Left: page title -->
      <div class="flex items-center gap-3 anim-in relative z-10">
        <h2 class="text-[18px] font-extrabold text-text-primary m-0 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-md">
          {{ pageTitle() }}
        </h2>
        @if (isLive()) {
          <span class="flex items-center gap-1.5 text-[10px] font-extrabold text-success tracking-widest uppercase bg-success/10 px-2 py-0.5 rounded-full border border-success/20 shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-success pulse-dot"></span>
            Live
          </span>
        }
      </div>

      <!-- Right: actions -->
      <div class="flex items-center gap-4 anim-in anim-d1 relative z-10">

        <!-- Notification bell -->
        <a routerLink="/notifications" 
           class="relative w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary bg-transparent hover:bg-bg-hover hover:text-text-primary transition-all duration-300 cursor-pointer text-decoration-none group border border-transparent hover:border-white/5 shadow-sm hover:shadow-md">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="group-hover:-translate-y-0.5 transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
          </svg>
          @if (unread() > 0) {
            <span class="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-extrabold flex items-center justify-center px-1 border-2 border-bg leading-none shadow-[0_0_8px_rgba(239,68,68,0.6)]">
              {{ unread() > 9 ? '9+' : unread() }}
            </span>
          }
        </a>
      </div>
    </header>
  `
})
export class TopbarComponent implements OnInit, OnDestroy {
  private auth      = inject(AuthService);
  private notif     = inject(NotificationService);
  private router    = inject(Router);
  private destroy$  = new Subject<void>();

  pageTitle = signal('Dashboard');
  unread    = this.notif.unreadCount;

  initials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? 'U';
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  });

  firstName = computed(() =>
    (this.auth.currentUser()?.fullName ?? 'User').split(' ')[0]
  );

  role = computed(() => this.auth.currentUser()?.role ?? '');

  avatarGradient = computed(() => {
    const r = this.role();
    if (r === 'ADMIN')   return 'linear-gradient(135deg,#ef4444,#b91c1c)';
    if (r === 'MANAGER') return 'linear-gradient(135deg,#f59e0b,#b45309)';
    return 'linear-gradient(135deg,#1d9bf0,#4f46e5)';
  });

  isLive = computed(() => {
    const t = this.pageTitle();
    return t === 'Dashboard' || t === 'Analytics';
  });

  ngOnInit() {
    this.setTitle(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: any) => this.setTitle(e.urlAfterRedirects ?? e.url));
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  private setTitle(url: string) {
    const base = '/' + url.split('/')[1];
    this.pageTitle.set(PAGE_META[base]?.title ?? 'ParkEase');
  }
}
