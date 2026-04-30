import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

const ROLE_COLOR: Record<string, string> = { ADMIN: '#f4212e', MANAGER: '#ffd400', DRIVER: '#1d9bf0' };

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width:700px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header -->
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);">
        <h1 style="font-size:22px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.3px;">Profile</h1>
        <p style="font-size:13px;color:#71767b;margin:0;">Manage your account settings</p>
      </div>

      <!-- Identity card -->
      <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:16px;" class="anim-in anim-d1">
        <div style="padding:20px 24px;display:flex;align-items:center;gap:16px;">
          <div style="width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;flex-shrink:0;"
               [style.background]="roleColor">
            {{ initials }}
          </div>
          <div style="flex:1;min-width:0;">
            <p style="font-size:17px;font-weight:800;color:#e7e9ea;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ auth.currentUser()?.fullName }}</p>
            <p style="font-size:13px;color:#71767b;margin:0 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ auth.currentUser()?.email }}</p>
            <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:.06em;text-transform:uppercase;"
                  [style.background]="roleColor + '18'" [style.color]="roleColor">{{ auth.currentUser()?.role }}</span>
          </div>
        </div>
      </div>

      <!-- Edit profile -->
      <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:16px;" class="anim-in anim-d2">
        <div style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
          <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">Edit Profile</p>
        </div>
        <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">
          <div>
            <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Full Name</label>
            <input [(ngModel)]="name" type="text" placeholder="Your full name"
                   style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                   onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
          </div>
          <div>
            <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Phone Number</label>
            <input [(ngModel)]="phone" type="tel" placeholder="Your phone number"
                   style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                   onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
          </div>
          <button (click)="saveProfile()" [disabled]="saving()"
                  style="align-self:flex-start;padding:10px 22px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                  [style.opacity]="saving() ? '.5' : '1'">
            {{ saving() ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Change password -->
      <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:16px;" class="anim-in anim-d3">
        <div style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
          <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">Change Password</p>
        </div>
        <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">
          <div style="position:relative;">
            <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Current Password</label>
            <input [(ngModel)]="currentPwd" [type]="showCurrent() ? 'text' : 'password'" placeholder="••••••••"
                   style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 44px 11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                   onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
            <button (click)="showCurrent.update(v=>!v)" type="button"
                    style="position:absolute;right:12px;bottom:11px;background:none;border:none;cursor:pointer;color:#71767b;padding:0;line-height:1;">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
          </div>
          <div style="position:relative;">
            <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">New Password <span style="color:#71767b;font-weight:400;">(min 8 chars)</span></label>
            <input [(ngModel)]="newPwd" [type]="showNew() ? 'text' : 'password'" placeholder="••••••••"
                   style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 44px 11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                   onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
            <button (click)="showNew.update(v=>!v)" type="button"
                    style="position:absolute;right:12px;bottom:11px;background:none;border:none;cursor:pointer;color:#71767b;padding:0;line-height:1;">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
          </div>
          <div>
            <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Confirm New Password</label>
            <input [(ngModel)]="confirmPwd" [type]="showNew() ? 'text' : 'password'" placeholder="••••••••"
                   style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                   onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
          </div>
          <button (click)="changePassword()" [disabled]="pwdSaving()"
                  style="align-self:flex-start;padding:10px 22px;border-radius:9999px;background:rgba(255,255,255,.06);color:#e7e9ea;border:1px solid rgba(255,255,255,.1);font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                  [style.opacity]="pwdSaving() ? '.5' : '1'">
            {{ pwdSaving() ? 'Updating…' : 'Update Password' }}
          </button>
        </div>
      </div>

      <!-- Danger zone -->
      <div style="background:rgba(244,33,46,.04);border:1px solid rgba(244,33,46,.15);border-radius:16px;overflow:hidden;" class="anim-in anim-d4">
        <div style="padding:16px 24px;border-bottom:1px solid rgba(244,33,46,.1);">
          <p style="font-size:14px;font-weight:700;color:#f4212e;margin:0;">Danger Zone</p>
        </div>
        <div style="padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <p style="font-size:14px;font-weight:600;color:#e7e9ea;margin:0 0 4px;">Delete Account</p>
            <p style="font-size:13px;color:#71767b;margin:0;">Permanently delete your account and all associated data.</p>
          </div>
          <button (click)="deleteAccount()"
                  style="padding:10px 20px;border-radius:9999px;border:1px solid rgba(244,33,46,.3);background:rgba(244,33,46,.08);color:#f4212e;cursor:pointer;font-size:13px;font-weight:700;white-space:nowrap;transition:background 150ms;"
                  onmouseenter="this.style.background='rgba(244,33,46,.14)'" onmouseleave="this.style.background='rgba(244,33,46,.08)'">
            Delete Account
          </button>
        </div>
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

  get initials()  { const n = this.auth.currentUser()?.fullName || 'U'; return n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(); }
  get roleColor() { return ROLE_COLOR[this.auth.currentUser()?.role ?? ''] ?? '#1d9bf0'; }

  ngOnInit() {
    const u = this.auth.currentUser();
    this.name  = u?.fullName ?? '';
    this.phone = (u as any)?.phone ?? '';
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
