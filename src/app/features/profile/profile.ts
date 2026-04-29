import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(16px)' }), animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))])])
  ],
  template: `
    <div class="p-6 space-y-6 page-host" @fadeUp>
      <div>
        <h2 style="font-size:22px;font-weight:700;color:var(--text-primary);margin:0;">Profile</h2>
        <p style="color:var(--text-secondary);font-size:14px;margin:4px 0 0;">Manage your account settings</p>
      </div>

      <div class="grid gap-6" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr));">

        <!-- Profile info -->
        <div class="card p-6 space-y-4">
          <div class="flex items-center gap-4 pb-4" style="border-bottom:1px solid var(--border);">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
                 style="background:var(--accent);color:white;">
              {{ initials }}
            </div>
            <div>
              <p style="font-size:17px;font-weight:800;color:var(--text-primary);margin:0;">{{ auth.currentUser()?.fullName }}</p>
              <p style="font-size:13px;color:var(--text-secondary);margin:2px 0 0;">{{ auth.currentUser()?.email }}</p>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                    [style.background]="roleColor + '18'" [style.color]="roleColor">{{ auth.currentUser()?.role }}</span>
            </div>
          </div>

          <h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">Edit Profile</h3>

          <div class="floating-group">
            <input [(ngModel)]="name" type="text" id="pname" placeholder=" "/>
            <label for="pname">Full Name</label>
          </div>
          <div class="floating-group">
            <input [(ngModel)]="phone" type="tel" id="pphone" placeholder=" "/>
            <label for="pphone">Phone Number</label>
          </div>

          <button (click)="saveProfile()" [disabled]="saving()"
                  class="btn-accent w-full" [style.opacity]="saving() ? '.6' : '1'">
            {{ saving() ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>

        <!-- Change password -->
        <div class="card p-6 space-y-4">
          <h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">Change Password</h3>

          <div class="floating-group">
            <input [(ngModel)]="currentPwd" [type]="showCurrent() ? 'text' : 'password'" id="cpwd" placeholder=" "/>
            <label for="cpwd">Current Password</label>
            <button (click)="showCurrent.update(v=>!v)" type="button" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
          </div>
          <div class="floating-group">
            <input [(ngModel)]="newPwd" [type]="showNew() ? 'text' : 'password'" id="npwd" placeholder=" "/>
            <label for="npwd">New Password (min 8)</label>
            <button (click)="showNew.update(v=>!v)" type="button" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
          </div>
          <div class="floating-group">
            <input [(ngModel)]="confirmPwd" [type]="showNew() ? 'text' : 'password'" id="conpwd" placeholder=" "/>
            <label for="conpwd">Confirm New Password</label>
          </div>

          <button (click)="changePassword()" [disabled]="pwdSaving()"
                  class="w-full py-3 rounded-full font-bold"
                  style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-primary);cursor:pointer;font-size:15px;"
                  [style.opacity]="pwdSaving() ? '.6' : '1'">
            {{ pwdSaving() ? 'Updating…' : 'Update Password' }}
          </button>
        </div>

      </div>

      <!-- Danger zone -->
      <div class="card p-6" style="border-color:rgba(244,33,46,.2);">
        <h3 style="font-size:14px;font-weight:700;color:#f4212e;margin:0 0 8px;">Danger Zone</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin:0 0 16px;">Permanently delete your account and all associated data.</p>
        <button (click)="deleteAccount()"
                style="padding:10px 24px;border-radius:9999px;border:1px solid rgba(244,33,46,.3);background:rgba(244,33,46,.06);color:#f4212e;cursor:pointer;font-size:14px;font-weight:600;">
          Delete Account
        </button>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  auth   = inject(AuthService);
  toast  = inject(ToastService);
  private http = inject(HttpClient);

  name = ''; phone = ''; currentPwd = ''; newPwd = ''; confirmPwd = '';
  saving    = signal(false);
  pwdSaving = signal(false);
  showCurrent = signal(false);
  showNew     = signal(false);

  get initials()  { const n = this.auth.currentUser()?.fullName || 'U'; return n.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase(); }
  get roleColor() { const m: Record<string,string> = { ADMIN:'#f4212e', MANAGER:'#ffd400', DRIVER:'#00ba7c' }; return m[this.auth.currentUser()?.role ?? ''] ?? 'var(--accent)'; }

  ngOnInit() {
    const u = this.auth.currentUser();
    this.name = u?.fullName ?? '';
  }

  saveProfile() {
    if (!this.name.trim()) { this.toast.error('Name cannot be empty.'); return; }
    this.saving.set(true);
    this.http.put('/api/v1/auth/profile', { fullName: this.name.trim(), phone: this.phone.trim() || undefined }).subscribe({
      next: () => { this.toast.success('Profile updated.'); this.saving.set(false); },
      error: err => { this.toast.error(err?.error?.message ?? 'Update failed.'); this.saving.set(false); }
    });
  }

  changePassword() {
    if (this.newPwd.length < 8) { this.toast.error('New password must be at least 8 characters.'); return; }
    if (this.newPwd !== this.confirmPwd) { this.toast.error('Passwords do not match.'); return; }
    this.pwdSaving.set(true);
    this.http.put('/api/v1/auth/change-password', { currentPassword: this.currentPwd, newPassword: this.newPwd, confirmPassword: this.confirmPwd }).subscribe({
      next: () => { this.toast.success('Password changed.'); this.currentPwd = ''; this.newPwd = ''; this.confirmPwd = ''; this.pwdSaving.set(false); },
      error: err => { this.toast.error(err?.error?.message ?? 'Failed to change password.'); this.pwdSaving.set(false); }
    });
  }

  deleteAccount() {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    this.http.delete('/api/v1/auth/account').subscribe({ next: () => this.auth.logout() });
  }
}
