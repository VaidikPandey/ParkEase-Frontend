import { Component, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  badge?: () => number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, ClickOutsideDirective],
  template: `
    <aside class="sidebar flex flex-col h-full bg-bg-card/40 backdrop-blur-2xl border-r border-white/5 shrink-0 transition-[width] duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] overflow-visible z-50"
           [style.width]="collapsed() ? '80px' : '260px'">

      <!-- Logo -->
      <div class="flex items-center gap-4 px-6 min-h-[80px] shrink-0">
        <img src="ParkEase.png" alt="ParkEase" class="w-8 h-8 rounded-xl shrink-0 object-cover">
        @if (!collapsed()) {
          <div class="flex flex-col anim-in">
            <span class="text-[18px] font-extrabold text-text-primary whitespace-nowrap tracking-tight leading-tight" style="text-shadow: 0 0 12px rgba(255,255,255,0.1);">ParkEase</span>
          </div>
        }
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-4 py-4 overflow-y-auto main-scroll flex flex-col gap-2">
        @for (item of visibleNavItems(); track item.route) {
          <a [routerLink]="item.route" routerLinkActive="bg-accent/10 border-l-[3px] border-accent !text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
             [routerLinkActiveOptions]="{exact: false}"
             #rla="routerLinkActive"
             class="flex items-center gap-4 px-4 py-3 rounded-2xl text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all duration-300 decoration-none relative group border-l-[3px] border-transparent"
             [title]="collapsed() ? item.label : ''">
             
            <span class="shrink-0 flex items-center transition-transform duration-300 group-hover:scale-110" 
                  [ngClass]="rla.isActive ? 'text-accent opacity-100' : 'opacity-60 group-hover:opacity-100'" 
                  [innerHTML]="item.icon"></span>
            
            @if (!collapsed()) {
              <span class="text-[14px] font-bold whitespace-nowrap flex-1 transition-all duration-300" 
                    [ngClass]="rla.isActive ? 'text-accent' : ''">{{ item.label }}</span>
              
              @if (item.badge && item.badge() > 0) {
                <span class="min-w-[20px] h-[20px] rounded-full bg-danger text-white text-[11px] font-extrabold flex items-center justify-center px-1.5 leading-none shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                  {{ item.badge()! > 9 ? '9+' : item.badge()! }}
                </span>
              }
            } @else if (item.badge && item.badge() > 0) {
              <span class="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            }
          </a>
        }
      </nav>

      <!-- Bottom: Profile first, then Collapse -->
      <div class="p-4 mt-auto flex flex-col gap-2 relative z-50">

        <!-- User Dropdown Area -->
        <div class="relative" (clickOutside)="dropdownOpen.set(false)">
          @if (dropdownOpen()) {
            <div class="absolute bottom-[calc(100%+12px)] left-0 w-[220px] glass-panel rounded-2xl p-2 flex flex-col gap-1 anim-in shadow-2xl z-50" style="transform-origin: bottom left;">
              <div class="px-3 py-2 mb-1 border-b border-white/5">
                <p class="text-[10px] uppercase tracking-widest text-text-secondary font-bold m-0">Account</p>
              </div>
              <a routerLink="/profile" (click)="dropdownOpen.set(false)" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all text-[13px] font-bold decoration-none cursor-pointer">
                View Profile
              </a>
              <button (click)="theme.toggle(); dropdownOpen.set(false)" class="flex items-center justify-between px-3 py-2.5 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all text-[13px] font-bold bg-transparent border-none cursor-pointer text-left w-full">
                <span>Theme</span>
                <span class="text-accent text-[11px] uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-md">{{ theme.isDark() ? 'Dark' : 'Light' }}</span>
              </button>
              <div class="h-[1px] bg-white/5 my-1 mx-2"></div>
              <button (click)="auth.logout()" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-danger hover:bg-danger/10 transition-all text-[13px] font-bold bg-transparent border-none cursor-pointer text-left w-full">
                Log out
              </button>
            </div>
          }

          <!-- User Trigger Button -->
          <button (click)="dropdownOpen.update(v => !v)" class="w-full flex items-center gap-3 p-2 rounded-2xl bg-bg-card border border-white/5 shadow-sm hover:shadow-md hover:border-white/10 hover:bg-bg-hover transition-all duration-300 cursor-pointer group">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-extrabold text-white shadow-inner group-hover:scale-105 transition-transform duration-300" [style.background]="avatarGradient()">
              {{ initials() }}
            </div>
            @if (!collapsed()) {
              <div class="flex-1 text-left min-w-0 anim-in">
                <p class="text-[13px] font-bold text-text-primary m-0 truncate group-hover:text-accent transition-colors">{{ auth.currentUser()?.fullName || 'User' }}</p>
                <p class="text-[10px] text-text-secondary font-bold m-0 mt-0.5 truncate uppercase tracking-widest">{{ auth.currentUser()?.role || 'Guest' }}</p>
              </div>
            }
          </button>
        </div>

        <!-- Collapse Toggle — always at the very bottom -->
        <button (click)="collapsed.update(v => !v)"
                class="flex items-center gap-4 px-4 py-2.5 rounded-2xl w-full text-text-secondary bg-transparent border-none cursor-pointer transition-all duration-300 hover:bg-bg-hover hover:text-text-primary group"
                [title]="collapsed() ? 'Expand' : 'Collapse'">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="shrink-0 opacity-50 group-hover:opacity-100 transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover:text-accent"
               [class.rotate-180]="collapsed()">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"/>
          </svg>
          @if (!collapsed()) {
            <span class="text-[12px] font-semibold flex-1 text-left anim-in opacity-60 group-hover:opacity-100">Collapse</span>
          }
        </button>

      </div>
    </aside>
  `
})
export class SidebarComponent {
  theme   = inject(ThemeService);
  auth    = inject(AuthService);
  private notif = inject(NotificationService);

  collapsed = signal(false);
  dropdownOpen = signal(false);

  initials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? 'U';
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  });

  avatarGradient = computed(() => {
    const r = this.auth.currentUser()?.role;
    if (r === 'ADMIN')   return 'linear-gradient(135deg,#ef4444,#b91c1c)'; // danger tones
    if (r === 'MANAGER') return 'linear-gradient(135deg,#f59e0b,#b45309)'; // warning tones
    return 'linear-gradient(135deg,#1d9bf0,#4f46e5)'; // accent to indigo
  });

  private svgs = {
    dashboard: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>`,
    slots:     `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"/></svg>`,
    bookings:  `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>`,
    vehicle:   `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`,
    analytics: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>`,
    notif:     `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>`,
    users:     `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>`,
    send:      `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>`,
    profile:   `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>`,
  };

  navItems: NavItem[] = [
    { label: 'Dashboard',         route: '/dashboard',         icon: this.svgs.dashboard },
    { label: 'Parking Slots',     route: '/slots',             icon: this.svgs.slots },
    { label: 'My Bookings',       route: '/bookings',          icon: this.svgs.bookings,  roles: ['DRIVER'] },
    { label: 'Vehicle Panel',     route: '/vehicle',           icon: this.svgs.vehicle,   roles: ['DRIVER'] },
    { label: 'Analytics',         route: '/analytics',         icon: this.svgs.analytics, roles: ['MANAGER', 'ADMIN'] },
    {
      label: 'Notifications',     route: '/notifications',     icon: this.svgs.notif,
      badge: () => this.notif.unreadCount()
    },
    { label: 'Users',             route: '/users',             icon: this.svgs.users,     roles: ['ADMIN'] },
    { label: 'Send Notification', route: '/send-notification', icon: this.svgs.send,      roles: ['ADMIN'] },
  ];

  visibleNavItems = computed(() => {
    const role = this.auth.currentUser()?.role;
    return this.navItems.filter(item => !item.roles || item.roles.includes(role ?? ''));
  });
}
