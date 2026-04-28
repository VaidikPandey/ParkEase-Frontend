import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-choose-role',
  standalone: true,
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-6"
         style="background:var(--bg-primary);">

      <!-- Logo -->
      <div class="flex items-center gap-2 mb-10">
        <div style="width:36px;height:36px;background:var(--accent);border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <span style="font-size:20px;font-weight:800;color:var(--text-primary);letter-spacing:-.5px;">ParkEase</span>
      </div>

      <div style="max-width:480px;width:100%;">
        <h1 style="font-size:26px;font-weight:800;color:var(--text-primary);margin:0 0 8px;text-align:center;letter-spacing:-.5px;">
          How will you use ParkEase?
        </h1>
        <p style="font-size:14px;color:var(--text-secondary);text-align:center;margin:0 0 32px;">
          Choose your role to get the right experience
        </p>

        <div class="flex flex-col gap-4">

          <!-- Driver card -->
          <button (click)="select('DRIVER')"
                  [disabled]="saving()"
                  class="w-full text-left p-5 rounded-2xl border-2 transition-all"
                  [style.border-color]="selected() === 'DRIVER' ? 'var(--accent)' : 'var(--border)'"
                  [style.background]="selected() === 'DRIVER' ? 'var(--accent-dim)' : 'var(--bg-card)'"
                  style="cursor:pointer;outline:none;">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                   [style.background]="selected() === 'DRIVER' ? 'var(--accent)' : 'var(--bg-hover)'"
                   [style.color]="selected() === 'DRIVER' ? 'white' : 'var(--text-secondary)'">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                </svg>
              </div>
              <div>
                <p style="font-size:16px;font-weight:700;margin:0;"
                   [style.color]="selected() === 'DRIVER' ? 'var(--accent)' : 'var(--text-primary)'">
                  Driver
                </p>
                <p style="font-size:13px;color:var(--text-secondary);margin:3px 0 0;">
                  Find and book parking spots near you
                </p>
              </div>
              @if (selected() === 'DRIVER') {
                <div class="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                     style="background:var(--accent);">
                  <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                </div>
              }
            </div>
          </button>

          <!-- Manager card -->
          <button (click)="select('MANAGER')"
                  [disabled]="saving()"
                  class="w-full text-left p-5 rounded-2xl border-2 transition-all"
                  [style.border-color]="selected() === 'MANAGER' ? 'var(--accent)' : 'var(--border)'"
                  [style.background]="selected() === 'MANAGER' ? 'var(--accent-dim)' : 'var(--bg-card)'"
                  style="cursor:pointer;outline:none;">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                   [style.background]="selected() === 'MANAGER' ? 'var(--accent)' : 'var(--bg-hover)'"
                   [style.color]="selected() === 'MANAGER' ? 'white' : 'var(--text-secondary)'">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/>
                </svg>
              </div>
              <div>
                <p style="font-size:16px;font-weight:700;margin:0;"
                   [style.color]="selected() === 'MANAGER' ? 'var(--accent)' : 'var(--text-primary)'">
                  Parking Manager
                </p>
                <p style="font-size:13px;color:var(--text-secondary);margin:3px 0 0;">
                  Manage your parking lots and spots
                </p>
              </div>
              @if (selected() === 'MANAGER') {
                <div class="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                     style="background:var(--accent);">
                  <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                </div>
              }
            </div>
          </button>
        </div>

        @if (errMsg()) {
          <p style="font-size:13px;color:#f4212e;text-align:center;margin:16px 0 0;">{{ errMsg() }}</p>
        }

        <button (click)="confirm()"
                [disabled]="!selected() || saving()"
                class="w-full mt-6 py-3 rounded-2xl font-bold text-white transition-all"
                style="font-size:15px;border:none;cursor:pointer;"
                [style.background]="selected() && !saving() ? 'var(--accent)' : 'var(--border)'"
                [style.color]="selected() && !saving() ? 'white' : 'var(--text-secondary)'">
          {{ saving() ? 'Setting up…' : 'Continue' }}
        </button>
      </div>
    </div>
  `
})
export class ChooseRoleComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  selected = signal<'DRIVER' | 'MANAGER' | null>(null);
  saving   = signal(false);
  errMsg   = signal('');

  select(role: 'DRIVER' | 'MANAGER') { this.selected.set(role); }

  confirm() {
    const role = this.selected();
    if (!role) return;
    this.saving.set(true);
    this.errMsg.set('');
    this.auth.selectRole(role).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errMsg.set('Something went wrong. Please try again.');
        this.saving.set(false);
      }
    });
  }
}
