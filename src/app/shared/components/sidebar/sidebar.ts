import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="sidebar flex flex-col h-full"
           [style.background]="'var(--bg-card)'"
           [style.border-right]="'1px solid var(--border)'"
           [style.width]="collapsed() ? '64px' : '220px'"
           style="transition: width 220ms cubic-bezier(.4,0,.2,1); overflow: hidden; flex-shrink: 0;">

      <!-- Logo -->
      <div class="flex items-center gap-3 px-4 py-5" style="min-height:64px;">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
             style="background: linear-gradient(135deg,#6366f1,#8b5cf6);">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
          </svg>
        </div>
        @if (!collapsed()) {
          <span style="color:var(--text-primary); font-weight:700; font-size:15px; white-space:nowrap;">ParkEase</span>
        }
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-2 space-y-1">
        @for (item of visibleNavItems(); track item.route) {
          <a [routerLink]="item.route" routerLinkActive="nav-active"
             class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
             style="color:var(--text-secondary); transition:all 220ms ease; text-decoration:none;"
             [title]="collapsed() ? item.label : ''">
            <span class="flex-shrink-0" [innerHTML]="item.icon"></span>
            @if (!collapsed()) {
              <span style="font-size:14px; font-weight:500; white-space:nowrap;">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <!-- Bottom: theme + collapse -->
      <div class="px-2 pb-4 space-y-1">
        <button (click)="theme.toggle()"
                class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl w-full"
                style="color:var(--text-secondary); background:transparent; border:none; cursor:pointer; transition:all 220ms ease;"
                [title]="collapsed() ? 'Toggle theme' : ''">
          @if (theme.isDark()) {
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="flex-shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
            </svg>
          } @else {
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="flex-shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
            </svg>
          }
          @if (!collapsed()) {
            <span style="font-size:14px; font-weight:500;">{{ theme.isDark() ? 'Light mode' : 'Dark mode' }}</span>
          }
        </button>

        <button (click)="collapsed.update(v => !v)"
                class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl w-full"
                style="color:var(--text-secondary); background:transparent; border:none; cursor:pointer; transition:all 220ms ease;">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="flex-shrink-0"
               [style.transform]="collapsed() ? 'rotate(180deg)' : ''"
               style="transition: transform 220ms ease;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"/>
          </svg>
          @if (!collapsed()) {
            <span style="font-size:14px; font-weight:500;">Collapse</span>
          }
        </button>
      </div>
    </aside>

    <style>
      .nav-item:hover { background: var(--bg-secondary) !important; color: var(--text-primary) !important; }
      .nav-active { background: rgba(99,102,241,.1) !important; color: #6366f1 !important; }
    </style>
  `
})
export class SidebarComponent {
  theme  = inject(ThemeService);
  auth   = inject(AuthService);
  collapsed = signal(false);

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
             </svg>`
    },
    {
      label: 'Parking Slots',
      route: '/slots',
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"/>
             </svg>`
    },
    {
      label: 'My Bookings',
      route: '/bookings',
      roles: ['DRIVER'],
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
             </svg>`
    },
    {
      label: 'Vehicle Panel',
      route: '/vehicle',
      roles: ['DRIVER'],
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
             </svg>`
    },
    {
      label: 'Analytics',
      route: '/analytics',
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
             </svg>`
    },
    {
      label: 'Notifications',
      route: '/notifications',
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
             </svg>`
    },
    {
      label: 'Users',
      route: '/users',
      roles: ['ADMIN'],
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
             </svg>`
    },
    {
      label: 'Send Notification',
      route: '/send-notification',
      roles: ['ADMIN'],
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
             </svg>`
    },
    {
      label: 'Profile',
      route: '/profile',
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
             </svg>`
    },
  ];

  visibleNavItems = () => {
    const role = this.auth.currentUser()?.role;
    return this.navItems.filter(item => !item.roles || item.roles.includes(role ?? ''));
  };
}
