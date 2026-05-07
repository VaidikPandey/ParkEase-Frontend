import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

const DEMO: Record<string, { email: string; password: string; color: string }> = {
  ADMIN:   { email: 'admin@parkease.com',   password: 'admin123',   color: '#f4212e' },
  MANAGER: { email: 'manager@parkease.com', password: 'manager123', color: '#ffd400' },
  DRIVER:  { email: 'driver@parkease.com',  password: 'driver123',  color: '#00ba7c' },
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(28px)' }),
        animate('500ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('250ms ease', style({ opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="flex" style="height:100vh;overflow:hidden;background:var(--bg-primary);position:relative;">

      <!-- Left decorative panel (desktop only) -->
      <div class="hidden lg:flex flex-col justify-between w-2/5 relative overflow-hidden p-12"
           style="border-right:1px solid var(--border);">
        <div class="absolute inset-0 grid-bg pointer-events-none" style="mask-image:linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);"></div>
        <div class="orb orb-1" style="width:360px;height:360px;top:-60px;left:-60px;background:radial-gradient(circle,rgba(29,155,240,.12) 0%,transparent 70%);"></div>
        <div class="orb orb-2" style="width:280px;height:280px;bottom:80px;right:-40px;background:radial-gradient(circle,rgba(120,40,200,.08) 0%,transparent 70%);"></div>

        <div class="relative z-10">
          <div class="flex items-center gap-2.5 mb-12">
            <img src="ParkEase.png" alt="ParkEase" class="w-8 h-8 rounded-xl object-cover">
            <span style="font-size:17px;font-weight:800;color:var(--text-primary);">ParkEase</span>
          </div>
          <h2 style="font-size:32px;font-weight:900;color:var(--text-primary);line-height:1.1;letter-spacing:-1px;margin:0 0 16px;">
            Smart parking<br>for everyone.
          </h2>
          <p style="font-size:15px;color:var(--text-secondary);line-height:1.6;margin:0;">
            Real-time spots, instant bookings, and live analytics — all in one dashboard.
          </p>
        </div>

        <div class="relative z-10 space-y-3">
          @for (item of sideFeatures; track item) {
            <div class="flex items-center gap-3">
              <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                   style="background:var(--accent-dim);">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="var(--accent)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span style="font-size:13px;color:var(--text-secondary);">{{ item }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Right: form panel -->
      <div class="flex-1 flex flex-col items-center justify-center p-8 relative" style="overflow-y:auto;">
        <div class="absolute inset-0 grid-bg pointer-events-none opacity-50" style="mask-image:radial-gradient(ellipse at center, black 40%, transparent 80%);"></div>

        <!-- Theme toggle -->
        <button (click)="theme.toggle()" class="absolute top-6 right-6 p-2 rounded-full nav-item"
                style="color:var(--text-secondary);background:transparent;border:none;cursor:pointer;">
          <svg *ngIf="theme.isDark()" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
          </svg>
          <svg *ngIf="!theme.isDark()" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
          </svg>
        </button>

        <div class="w-full" style="max-width:380px;" @fadeSlideUp>

          <!-- Admin portal badge -->
          @if (isAdminPortal()) {
            <div class="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-xl" @fadeIn
                 style="background:rgba(244,33,46,.06);border:1px solid rgba(244,33,46,.2);">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f4212e" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
              </svg>
              <span style="font-size:12px;font-weight:600;color:#f4212e;">Admin Portal</span>
              <a routerLink="/home" style="margin-left:auto;font-size:11px;color:var(--text-secondary);text-decoration:none;">← Back</a>
            </div>
          }

          <!-- Tab switcher -->
          <div class="flex items-center gap-2 mb-8">
            <!-- Sign in: solid blue when active, ghost when inactive -->
            <button (click)="switchTab('login')"
                    class="flex-1 py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
                    [style.background]="tab() === 'login' ? 'rgba(14,165,233,0.15)' : 'transparent'"
                    [style.color]="tab() === 'login' ? 'var(--accent)' : 'var(--text-secondary)'"
                    [style.border]="tab() === 'login' ? '1px solid rgba(14,165,233,0.3)' : '1px solid var(--border)'"
                    style="cursor:pointer;letter-spacing:.01em;">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
              </svg>
              Sign in
            </button>
            <!-- Sign up: ghost when inactive, muted glass when active -->
            <button (click)="switchTab('signup')"
                    class="flex-1 py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
                    [style.background]="tab() === 'signup' ? 'rgba(14,165,233,0.15)' : 'transparent'"
                    [style.color]="tab() === 'signup' ? 'var(--accent)' : 'var(--text-secondary)'"
                    [style.border]="tab() === 'signup' ? '1px solid rgba(14,165,233,0.3)' : '1px dashed var(--border)'"
                    style="cursor:pointer;letter-spacing:.01em;">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"/>
              </svg>
              Sign up
            </button>
          </div>

          <!-- ── SIGN IN ── -->
          @if (tab() === 'login') {
            <div @fadeIn>
              <div class="mb-6">
                <h1 style="font-size:24px;font-weight:800;color:var(--text-primary);margin:0 0 4px;letter-spacing:-.6px;">Welcome back</h1>
                <p style="font-size:14px;color:var(--text-secondary);margin:0;">Sign in to your ParkEase account</p>
              </div>

              <!-- Quick-pick roles -->
              <div class="grid grid-cols-3 gap-2 mb-5">
                @for (r of roleOptions; track r.id) {
                  <button (click)="pickRole(r.id)"
                          class="py-2 rounded-xl text-xs font-semibold"
                          [style.background]="selectedRole() === r.id ? r.color + '18' : 'var(--bg-hover)'"
                          [style.border]="'1px solid ' + (selectedRole() === r.id ? r.color : 'var(--border)')"
                          [style.color]="selectedRole() === r.id ? r.color : 'var(--text-secondary)'"
                          style="cursor:pointer;outline:none;transition:all 180ms ease;">
                    {{ r.label }}
                  </button>
                }
              </div>

              <!-- Google -->
              <button (click)="googleLogin()"
                      class="w-full flex items-center justify-center gap-2.5 mb-4 rounded-full py-3 font-semibold"
                      style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-primary);cursor:pointer;font-size:14px;transition:border-color var(--transition);"
                      onmouseenter="this.style.borderColor='var(--border-focus)'"
                      onmouseleave="this.style.borderColor='var(--border)'">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div class="flex items-center gap-3 mb-4">
                <div style="flex:1;height:1px;background:var(--border);"></div>
                <span style="font-size:12px;color:var(--text-secondary);">or</span>
                <div style="flex:1;height:1px;background:var(--border);"></div>
              </div>

              <!-- Email -->
              <div class="floating-group mb-3">
                <input [(ngModel)]="email" type="email" id="em" placeholder=" " (keydown.enter)="submit()" autocomplete="email"/>
                <label for="em">Email address</label>
              </div>

              <!-- Password -->
              <div class="floating-group mb-4">
                <input [(ngModel)]="password" [type]="showPwd() ? 'text' : 'password'" id="pw" placeholder=" " (keydown.enter)="submit()" autocomplete="current-password"/>
                <label for="pw">Password</label>
                <button (click)="showPwd.update(v => !v)" type="button"
                        style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:0;">
                  <svg *ngIf="!showPwd()" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <svg *ngIf="showPwd()" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
                  </svg>
                </button>
              </div>

              <!-- Demo hint -->
              @if (selectedRole()) {
                <div class="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" @fadeIn
                     [style.background]="roleColor() + '0d'"
                     [style.border]="'1px solid ' + roleColor() + '25'">
                  <span style="font-size:11px;" [style.color]="roleColor()">Demo credentials pre-filled for {{ selectedRole() | titlecase }}</span>
                </div>
              }

              <!-- Error -->
              @if (error()) {
                <div class="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl" @fadeIn
                     style="background:rgba(244,33,46,.08);border:1px solid rgba(244,33,46,.2);color:#f4212e;font-size:13px;">
                  {{ error() }}
                </div>
              }

              <button (click)="submit()" [disabled]="loading()"
                      class="w-full py-3 rounded-full font-bold"
                      style="background:rgba(14,165,233,0.15);color:var(--accent);
                             border:1px solid rgba(14,165,233,0.3);
                             cursor:pointer;font-size:15px;transition:all 200ms ease;"
                      [style.opacity]="loading() ? '.6' : '1'"
                      onmouseenter="this.style.background='rgba(14,165,233,0.25)'"
                      onmouseleave="this.style.background='rgba(14,165,233,0.15)'">
                {{ loading() ? 'Signing in…' : 'Sign in' }}
              </button>
              @if (loading()) {
                <p style="font-size:12px;color:var(--text-secondary);text-align:center;margin-top:8px;">
                  First request may take up to 60s — server is warming up
                </p>
              }
            </div>
          }

          <!-- ── SIGN UP ── -->
          @if (tab() === 'signup') {
            <div @fadeIn>
              <div class="mb-6">
                <h1 style="font-size:24px;font-weight:800;color:var(--text-primary);margin:0 0 4px;letter-spacing:-.6px;">Create account</h1>
                <p style="font-size:14px;color:var(--text-secondary);margin:0;">Join ParkEase — it's free</p>
              </div>

              <!-- Google signup -->
              <button (click)="googleLogin()"
                      class="w-full flex items-center justify-center gap-2.5 mb-4 rounded-full py-3 font-semibold"
                      style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-primary);cursor:pointer;font-size:14px;transition:border-color var(--transition);"
                      onmouseenter="this.style.borderColor='var(--border-focus)'"
                      onmouseleave="this.style.borderColor='var(--border)'">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

              <div class="flex items-center gap-3 mb-4">
                <div style="flex:1;height:1px;background:var(--border);"></div>
                <span style="font-size:12px;color:var(--text-secondary);">or</span>
                <div style="flex:1;height:1px;background:var(--border);"></div>
              </div>

              <!-- Full name -->
              <div class="floating-group mb-3">
                <input [(ngModel)]="regName" type="text" id="rn" placeholder=" " autocomplete="name"/>
                <label for="rn">Full name</label>
              </div>

              <!-- Email -->
              <div class="floating-group mb-3">
                <input [(ngModel)]="regEmail" type="email" id="re" placeholder=" " autocomplete="email"/>
                <label for="re">Email address</label>
              </div>

              <!-- Password -->
              <div class="floating-group mb-3">
                <input [(ngModel)]="regPassword" [type]="showRegPwd() ? 'text' : 'password'" id="rp" placeholder=" " autocomplete="new-password"/>
                <label for="rp">Password (min 8 chars)</label>
                <button (click)="showRegPwd.update(v => !v)" type="button"
                        style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:0;">
                  <svg *ngIf="!showRegPwd()" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <svg *ngIf="showRegPwd()" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
                  </svg>
                </button>
              </div>

              <!-- Phone (optional) -->
              <div class="floating-group mb-4">
                <input [(ngModel)]="regPhone" type="tel" id="rph" placeholder=" " autocomplete="tel"/>
                <label for="rph">Phone (optional)</label>
              </div>

              <!-- Role picker -->
              <div class="mb-5">
                <p style="font-size:12px;color:var(--text-secondary);margin:0 0 8px;">I am a…</p>
                <div class="grid grid-cols-2 gap-2">
                  @for (r of signupRoles; track r.id) {
                    <button (click)="regRole.set(r.id)"
                            class="py-3 rounded-xl text-sm font-semibold flex flex-col items-center gap-1"
                            [style.background]="regRole() === r.id ? r.color + '15' : 'var(--bg-hover)'"
                            [style.border]="'1px solid ' + (regRole() === r.id ? r.color : 'var(--border)')"
                            [style.color]="regRole() === r.id ? r.color : 'var(--text-secondary)'"
                            style="cursor:pointer;outline:none;transition:all 180ms ease;">
                      {{ r.label }}
                      <span style="font-size:10px;opacity:.7;font-weight:400;">{{ r.desc }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Error / success -->
              @if (regError()) {
                <div class="mb-4 px-3 py-2.5 rounded-xl" @fadeIn
                     style="background:rgba(244,33,46,.08);border:1px solid rgba(244,33,46,.2);color:#f4212e;font-size:13px;">
                  {{ regError() }}
                </div>
              }
              @if (regSuccess()) {
                <div class="mb-4 px-3 py-2.5 rounded-xl" @fadeIn
                     style="background:rgba(0,186,124,.08);border:1px solid rgba(0,186,124,.2);color:#00ba7c;font-size:13px;">
                  Account created! Signing you in…
                </div>
              }

              <button (click)="register()" [disabled]="regLoading()"
                      class="w-full py-3 rounded-full font-bold"
                      style="background:rgba(14,165,233,0.15);color:var(--accent);
                             border:1px solid rgba(14,165,233,0.3);
                             cursor:pointer;font-size:15px;transition:all 200ms ease;"
                      [style.opacity]="regLoading() ? '.6' : '1'"
                      onmouseenter="this.style.background='rgba(14,165,233,0.25)'"
                      onmouseleave="this.style.background='rgba(14,165,233,0.15)'">
                {{ regLoading() ? 'Creating account…' : 'Create account' }}
              </button>
              @if (regLoading()) {
                <p style="font-size:12px;color:var(--text-secondary);text-align:center;margin-top:8px;">
                  First request may take up to 60s — server is warming up
                </p>
              }
            </div>
          }

          <p class="text-center mt-5" style="font-size:13px;color:var(--text-secondary);">
            <a routerLink="/home" style="color:var(--accent);text-decoration:none;">← Back to home</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private http   = inject(HttpClient);
  theme = inject(ThemeService);

  // Sign in
  tab          = signal<'login' | 'signup'>('login');
  email        = '';
  password     = '';
  loading      = signal(false);
  error        = signal('');
  showPwd      = signal(false);
  selectedRole = signal<string>('');

  // Sign up
  regName     = '';
  regEmail    = '';
  regPassword = '';
  regPhone    = '';
  regRole     = signal<'DRIVER' | 'MANAGER'>('DRIVER');
  regLoading  = signal(false);
  regError    = signal('');
  regSuccess  = signal(false);
  showRegPwd  = signal(false);

  roleOptions = [
    { id: 'ADMIN',   label: 'Admin',   color: '#f4212e' },
    { id: 'MANAGER', label: 'Manager', color: '#ffd400' },
    { id: 'DRIVER',  label: 'Driver',  color: '#00ba7c' },
  ];

  signupRoles: { id: 'DRIVER' | 'MANAGER'; label: string; desc: string; color: string }[] = [
    { id: 'DRIVER',  label: 'Driver',  desc: 'Book parking spots',  color: '#00ba7c' },
    { id: 'MANAGER', label: 'Manager', desc: 'Manage parking lots', color: '#ffd400' },
  ];
  isAdminPortal = signal(false);

  sideFeatures = [
    'Real-time parking spot availability',
    'Instant booking with payment',
    'Revenue and utilisation analytics',
    'Vehicle & plate management',
    'Event-driven spot status sync',
  ];

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const tab  = params.get('tab');
    const role = params.get('role') || '';

    if (role === 'ADMIN') {
      this.isAdminPortal.set(true);
    }

    if (tab === 'signup') this.tab.set('signup');
    if (role && DEMO[role]) this.pickRole(role);
    if (params.get('error') === 'oauth2_failed') {
      this.error.set('Google sign-in failed. Please try again or use email login.');
    }
  }

  switchTab(t: 'login' | 'signup') {
    this.tab.set(t);
    this.error.set('');
    this.regError.set('');
  }

  pickRole(id: string) {
    this.selectedRole.set(id);
    const d = DEMO[id];
    if (d) { this.email = d.email; this.password = d.password; }
  }

  roleColor(): string { return DEMO[this.selectedRole()]?.color ?? 'var(--accent)'; }

  submit() {
    if (!this.email || !this.password) { this.error.set('Please enter your email and password.'); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => { this.router.navigate(['/dashboard']); },
      error: err => {
        this.error.set(err?.error?.message ?? 'Invalid credentials.');
        this.loading.set(false);
      }
    });
  }

  register() {
    if (!this.regName.trim())          { this.regError.set('Full name is required.');         return; }
    if (!this.regEmail.trim())         { this.regError.set('Email is required.');             return; }
    if (this.regPassword.length < 8)   { this.regError.set('Password must be at least 8 characters.'); return; }

    this.regLoading.set(true);
    this.regError.set('');

    const body = {
      fullName: this.regName.trim(),
      email:    this.regEmail.trim(),
      password: this.regPassword,
      phone:    this.regPhone.trim() || undefined,
      role:     this.regRole(),
    };

    this.http.post<any>('/api/v1/auth/register', body, { withCredentials: true }).pipe(
      tap(res => this.auth.storeSession(res))
    ).subscribe({
      next: () => {
        this.regSuccess.set(true);
        setTimeout(() => { this.router.navigate(['/dashboard']); }, 800);
      },
      error: err => {
        this.regError.set(err?.error?.message ?? 'Registration failed. Please try again.');
        this.regLoading.set(false);
      }
    });
  }

  googleLogin() {
    const role = this.tab() === 'signup' ? this.regRole() : (this.selectedRole() || 'DRIVER');
    sessionStorage.setItem('pending_oauth_role', role);
    window.location.href = `${environment.authServiceUrl}/oauth2/authorize/google`;
  }
}
