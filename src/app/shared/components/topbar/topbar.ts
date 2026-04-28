import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="flex items-center justify-between px-6"
            style="height:64px; background:var(--bg-card); border-bottom:1px solid var(--border);">
      <div>
        <h1 style="font-size:16px; font-weight:600; color:var(--text-primary); margin:0;">
          Smart Parking Dashboard
        </h1>
        <p style="font-size:12px; color:var(--text-secondary); margin:0;">
          {{ today }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- User pill -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl"
             style="background:var(--bg-secondary); border:1px solid var(--border);">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
               style="background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white;">
            {{ initials }}
          </div>
          <div>
            <p style="font-size:13px; font-weight:500; color:var(--text-primary); margin:0; line-height:1.2;">
              {{ user?.fullName || 'User' }}
            </p>
            <p style="font-size:11px; color:var(--text-secondary); margin:0; line-height:1.2;">
              {{ user?.role }}
            </p>
          </div>
        </div>

        <!-- Logout -->
        <button (click)="auth.logout()"
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style="background:transparent; border:1px solid var(--border); color:var(--text-secondary); cursor:pointer; font-size:13px; transition:all 220ms ease;"
                onmouseenter="this.style.borderColor='#ef4444'; this.style.color='#ef4444'"
                onmouseleave="this.style.borderColor='var(--border)'; this.style.color='var(--text-secondary)'">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
          </svg>
          Logout
        </button>
      </div>
    </header>
  `
})
export class TopbarComponent {
  auth = inject(AuthService);
  user = this.auth.currentUser();
  today = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  get initials() {
    return (this.user?.fullName || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  }
}
