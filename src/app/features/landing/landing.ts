import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ThemeService } from '../../core/services/theme.service';

interface Role {
  id: 'ADMIN' | 'MANAGER' | 'DRIVER';
  label: string;
  subtitle: string;
  icon: string;
  bigIcon: string;
  badge: string;
  badgeColor: string;
  colorRgb: string;
  topGradient: string;
  features: string[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(32px)' }),
        animate('600ms 100ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(40px) scale(.97)' }),
          stagger(100, [animate('500ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))])
        ], { optional: true })
      ])
    ]),
  ],
  template: `
    <div style="min-height:100vh;background:var(--bg-primary);position:relative;">

      <!-- Topbar — fixed so it never scrolls -->
      <nav class="flex items-center justify-between px-6 md:px-12 py-4 relative overflow-hidden"
           style="position:fixed;top:0;left:0;right:0;z-index:100;
                  background:var(--nav-bg);
                  backdrop-filter:saturate(200%) blur(28px);
                  -webkit-backdrop-filter:saturate(200%) blur(28px);
                  box-shadow:0 4px 40px rgba(0,0,0,0.06);">

        <!-- Nav grid overlay -->
        <div class="absolute inset-0 grid-bg pointer-events-none opacity-60"
             style="mask-image:linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);"></div>

        <div class="flex items-center gap-3 relative z-10">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background:var(--accent);box-shadow:0 0 20px rgba(14,165,233,0.3);">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
            </svg>
          </div>
          <span style="font-family:'Space Grotesk',sans-serif;font-size:21px;font-weight:800;letter-spacing:-0.6px;color:var(--text-primary);">ParkEase</span>
        </div>

        <div class="flex items-center gap-2 relative z-10">
          <button (click)="theme.toggle()" class="p-2 rounded-full nav-item"
                  style="background:transparent;border:none;cursor:pointer;">
            @if (theme.isDark()) {
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
              </svg>
            } @else {
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
              </svg>
            }
          </button>

          <a routerLink="/login" [queryParams]="{tab:'signup'}"
             style="font-size:13px;font-weight:600;padding:7px 16px;border-radius:9999px;
                    border:1px solid var(--border);color:var(--text-secondary);
                    background:transparent;text-decoration:none;display:inline-flex;align-items:center;gap:5px;
                    transition:all 200ms ease;"
             onmouseenter="this.style.background='var(--bg-hover)';this.style.color='var(--text-primary)'"
             onmouseleave="this.style.background='transparent';this.style.color='var(--text-secondary)'">
            Sign up
          </a>

          <a routerLink="/login"
             style="font-size:13px;font-weight:700;padding:7px 18px;border-radius:9999px;
                    background:rgba(14,165,233,0.15);color:var(--accent);
                    border:1px solid rgba(14,165,233,0.25);
                    text-decoration:none;display:inline-flex;align-items:center;gap:5px;
                    transition:all 200ms ease;"
             onmouseenter="this.style.background='rgba(14,165,233,0.22)';this.style.transform='translateY(-1px)'"
             onmouseleave="this.style.background='rgba(14,165,233,0.15)';this.style.transform='translateY(0)'">
            Sign in
          </a>
        </div>
      </nav>

      <!-- Navbar gradient fade tail — makes nav blend into page -->
      <div style="position:fixed;top:56px;left:0;right:0;height:48px;z-index:99;pointer-events:none;
                  background:linear-gradient(to bottom, var(--nav-bg), transparent);
                  -webkit-mask-image:linear-gradient(to bottom, black 0%, transparent 100%);"></div>

      <div style="height:73px;"></div>

      <div class="relative" style="overflow:hidden;">

        <!-- Grid background -->
        <div class="grid-bg" style="position:absolute;inset:0;z-index:0;pointer-events:none;"></div>

        <!-- Orbs -->
        <div style="position:absolute;width:520px;height:520px;top:-120px;left:-120px;background:radial-gradient(circle,rgba(29,155,240,.18) 0%,transparent 70%);pointer-events:none;border-radius:50%;z-index:1;"></div>
        <div style="position:absolute;width:400px;height:400px;bottom:0;right:-80px;background:radial-gradient(circle,rgba(120,40,200,.14) 0%,transparent 70%);pointer-events:none;border-radius:50%;z-index:1;"></div>
        <div style="position:absolute;width:300px;height:300px;top:40%;left:60%;background:radial-gradient(circle,rgba(0,186,124,.1) 0%,transparent 70%);pointer-events:none;border-radius:50%;z-index:1;"></div>

        <!-- Hero -->
        <section class="relative flex flex-col items-center text-center pt-20 pb-16 px-6" style="z-index:10;" @fadeUp>
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8"
               style="background:var(--accent-dim);border:1px solid rgba(29,155,240,.25);font-size:12px;color:var(--accent);font-weight:600;letter-spacing:.5px;">
            <span class="w-1.5 h-1.5 rounded-full inline-block" style="background:var(--accent);animation:pulse 2s infinite;"></span>
            PARKING, MADE SIMPLE
          </div>

          <h1 style="font-size:clamp(36px,6vw,68px);font-weight:900;line-height:1.06;letter-spacing:-2px;color:var(--text-primary);max-width:720px;margin:0 0 20px;">
            Park smarter,<br>
            <span style="color:var(--accent);">manage better.</span>
          </h1>

          <p style="font-size:18px;color:var(--text-secondary);max-width:480px;margin:0 0 40px;line-height:1.6;">
            Find a spot, book it instantly, and never worry about parking again.
          </p>

          <div class="flex flex-col items-center gap-3 w-full" style="max-width:360px;">
            <button (click)="googleLogin()"
                    class="w-full flex items-center justify-center gap-2.5 py-3 rounded-full font-semibold"
                    style="background:var(--text-primary);color:var(--bg-primary);border:none;cursor:pointer;transition:opacity var(--transition);font-size:15px;"
                    onmouseenter="this.style.opacity='.88'" onmouseleave="this.style.opacity='1'">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div class="flex items-center gap-3 my-5" style="width:100%;max-width:360px;">
            <div style="flex:1;height:1px;background:var(--border);"></div>
            <span style="font-size:13px;color:var(--text-secondary);">or sign in as</span>
            <div style="flex:1;height:1px;background:var(--border);"></div>
          </div>

          <!-- Role cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full" style="max-width:740px;" [@staggerCards]="'in'">
            @for (role of roles; track role.id) {
              <button (click)="pickRole(role.id)"
                      class="group relative text-left rounded-2xl overflow-hidden flex flex-col w-full h-full"
                      style="background:var(--bg-card);border:1.5px solid var(--border);cursor:pointer;outline:none;
                             transition:border-color 200ms ease,box-shadow 200ms ease,transform 200ms ease;"
                      [style.border-color]="selected() === role.id ? role.badgeColor : ''"
                      [style.box-shadow]="selected() === role.id ? '0 0 28px ' + role.badgeColor + '33' : ''"
                      onmouseenter="this.style.transform='translateY(-3px)'"
                      onmouseleave="this.style.transform='translateY(0)'">

                <div class="relative flex flex-col items-center justify-center py-7 overflow-hidden shrink-0"
                     [style.background]="role.topGradient">
                  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:130px;height:130px;border-radius:50%;opacity:.1;"
                       [style.border]="'1px solid ' + role.badgeColor"></div>
                  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:190px;height:190px;border-radius:50%;opacity:.05;"
                       [style.border]="'1px solid ' + role.badgeColor"></div>

                  <div class="relative flex items-center justify-center rounded-2xl"
                       style="width:68px;height:68px;z-index:10;"
                       [style.background]="'rgba(' + role.colorRgb + ',.25)'"
                       [style.color]="role.badgeColor"
                       [style.box-shadow]="'0 4px 24px rgba(' + role.colorRgb + ',.35)'">
                    <!-- Ghost user icon behind the main icon -->
                    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:.18;pointer-events:none;">
                      <svg width="52" height="52" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    </div>
                    <span style="position:relative;z-index:10;" [innerHTML]="role.bigIcon"></span>
                  </div>
                  <span class="relative mt-3 text-xs font-bold px-2.5 py-0.5 rounded-full tracking-wider"
                        style="z-index:10;"
                        [style.background]="'rgba(' + role.colorRgb + ',.25)'"
                        [style.color]="role.badgeColor">
                    {{ role.badge }}
                  </span>
                </div>

                <div class="px-5 pb-5 pt-4 flex-1">
                  <p style="font-size:16px;font-weight:800;color:var(--text-primary);margin:0 0 3px;letter-spacing:-.3px;">{{ role.label }}</p>
                  <p style="font-size:12px;color:var(--text-secondary);margin:0 0 12px;line-height:1.4;">{{ role.subtitle }}</p>
                  <ul class="space-y-1.5">
                    @for (f of role.features; track f) {
                      <li class="flex items-center gap-2" style="font-size:11.5px;color:var(--text-secondary);">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="flex-shrink:0">
                          <circle cx="6.5" cy="6.5" r="6.5" [attr.fill]="role.badgeColor" fill-opacity=".18"/>
                          <path d="M4 6.5l1.8 1.8L9 4.5" [attr.stroke]="role.badgeColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span [innerHTML]="f"></span>
                      </li>
                    }
                  </ul>
                </div>
              </button>
            }
          </div>

          @if (selected()) {
            <div class="mt-5" @fadeUp>
              <a [routerLink]="['/login']" [queryParams]="{role: selected()}"
                 style="display:inline-flex;align-items:center;gap:8px;
                        background:rgba(14,165,233,0.12);color:var(--accent);
                        border:1px solid rgba(14,165,233,0.25);
                        font-size:15px;font-weight:700;padding:12px 32px;border-radius:9999px;text-decoration:none;
                        transition:all 200ms ease;"
                 onmouseenter="this.style.background='rgba(14,165,233,0.2)';this.style.transform='translateY(-2px)'"
                 onmouseleave="this.style.background='rgba(14,165,233,0.12)';this.style.transform='translateY(0)'">
                Continue as {{ selected()! | titlecase }}
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                </svg>
              </a>
            </div>
          }
        </section>

        <!-- Feature strip -->
        <section class="relative px-6 md:px-12 py-12" style="border-top:1px solid var(--border);z-index:10;">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            @for (f of features; track f.label) {
              <div class="text-center">
                <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">{{ f.label }}</p>
                <p style="font-size:12px;color:var(--text-secondary);margin:0;line-height:1.4;">{{ f.desc }}</p>
              </div>
            }
          </div>
        </section>

        <!-- Enterprise / Admin CTA -->
        <section class="relative px-6 md:px-12 py-14" style="border-top:1px solid var(--border);z-index:10;">
          <div class="max-w-2xl mx-auto text-center">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
                 style="background:rgba(244,33,46,0.07);border:1px solid rgba(244,33,46,0.15);font-size:11px;color:#f4212e;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21"/>
              </svg>
              For Businesses &amp; Operators
            </div>
            <h2 style="font-family:'Space Grotesk',sans-serif;font-size:clamp(22px,3.5vw,34px);font-weight:800;color:var(--text-primary);letter-spacing:-0.8px;margin:0 0 12px;">
              Want to manage your own parking lot?
            </h2>
            <p style="font-size:15px;color:var(--text-secondary);margin:0 0 28px;line-height:1.7;max-width:500px;margin-left:auto;margin-right:auto;">
              Get a dedicated admin dashboard with full control over your lots, live occupancy, revenue, and team management. Reach out and we'll set you up.
            </p>
            <a href="mailto:pandeyvaidik04@gmail.com"
               style="display:inline-flex;align-items:center;gap:8px;
                      background:rgba(244,33,46,0.1);color:#f4212e;
                      border:1px solid rgba(244,33,46,0.25);
                      font-size:14px;font-weight:700;padding:11px 28px;border-radius:9999px;text-decoration:none;
                      transition:all 200ms ease;"
               onmouseenter="this.style.background='rgba(244,33,46,0.18)';this.style.transform='translateY(-2px)'"
               onmouseleave="this.style.background='rgba(244,33,46,0.1)';this.style.transform='translateY(0)'">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
              </svg>
              Get in touch
            </a>
          </div>
        </section>

        <footer class="relative text-center py-6 px-6" style="border-top:1px solid var(--border);z-index:10;">
          <p style="font-size:12px;color:var(--text-secondary);margin:0;">
            &copy; 2025 ParkEase &middot; Smart Parking Management System
          </p>
        </footer>

      </div>
    </div>

    <style>
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }

      /* Scroll reveal */
      .reveal {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1);
      }
      .reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }
      .reveal-delay-1 { transition-delay: 0.1s; }
      .reveal-delay-2 { transition-delay: 0.2s; }
      .reveal-delay-3 { transition-delay: 0.3s; }

      /* Dark mode nav bg variable */
      /* Handled globally via --nav-bg CSS variable */
    </style>
  `
})
export class LandingComponent {
  theme = inject(ThemeService);
  router = inject(Router);

  selected = signal<'ADMIN' | 'MANAGER' | 'DRIVER' | null>(null);

  roles: Role[] = [
    {
      id: 'ADMIN', label: 'Admin', subtitle: 'Manage your entire parking operation',
      badge: 'ENTERPRISE', badgeColor: '#f4212e', colorRgb: '244,33,46',
      topGradient: 'linear-gradient(135deg,#3d0810 0%,#1a0307 100%)',
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>`,
      bigIcon: `<svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>`,
      features: ['Full dashboard control', 'Approve &amp; manage lots', 'Revenue &amp; team reports', 'Contact us to get started']
    },
    {
      id: 'MANAGER', label: 'Manager', subtitle: 'Run your parking lot day-to-day',
      badge: 'OPERATOR', badgeColor: '#ffd400', colorRgb: '255,212,0',
      topGradient: 'linear-gradient(135deg,#3a3300 0%,#1a1800 100%)',
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>`,
      bigIcon: `<svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>`,
      features: ['Manage spots &amp; availability', 'View all bookings', 'Track earnings', 'Set pricing &amp; rules']
    },
    {
      id: 'DRIVER', label: 'Driver', subtitle: 'Find and book a spot in seconds',
      badge: 'FREE', badgeColor: '#00ba7c', colorRgb: '0,186,124',
      topGradient: 'linear-gradient(135deg,#003d28 0%,#001a11 100%)',
      icon: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`,
      bigIcon: `<svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`,
      features: ['See available spots near you', 'Book &amp; pay in seconds', 'Manage your vehicles', 'View past bookings']
    }
  ];

  features = [
    { label: 'Always Up to Date', desc: 'Spot availability updates in real time' },
    { label: 'Book in Seconds', desc: 'No queues, no calls, just tap and go' },
    { label: 'Earn More', desc: 'Owners see revenue grow from day one' },
    { label: 'Works Everywhere', desc: 'Any device, any browser' }
  ];

  pickRole(id: 'ADMIN' | 'MANAGER' | 'DRIVER') {
    this.selected.set(this.selected() === id ? null : id);
  }

  googleLogin() {
    window.location.href = 'http://localhost:8080/oauth2/authorize/google';
  }
}
