import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../core/services/toast.service';
import { ThemeSelectComponent, ThemeSelectOption } from '../../shared/components/theme-select/theme-select';

interface User {
  userId: number; fullName: string; email: string; role: string;
  phone: string; isActive: boolean; createdAt: string;
}

interface ComposeEmail { to: string; subject: string; body: string; }

const ROLE_COLOR: Record<string, string> = { ADMIN: '#f4212e', MANAGER: '#ffd400', DRIVER: '#1d9bf0' };

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemeSelectComponent],
  template: `
    <div style="max-width:1100px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header -->
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <h1 style="font-size:22px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.3px;">User Management</h1>
          <p style="font-size:13px;color:#71767b;margin:0;">{{ filtered().length }} users</p>
        </div>
        <!-- Filters -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <div style="position:relative;">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#71767b" stroke-width="2"
                 style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"/>
            </svg>
            <input [(ngModel)]="search" type="text" placeholder="Search name / email" (ngModelChange)="applyFilter()"
                   style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:9px 14px 9px 34px;font-size:13px;color:#e7e9ea;outline:none;width:220px;transition:border-color 150ms;"
                   onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
          </div>
          <app-theme-select
            placeholder="All roles"
            width="160px"
            [options]="roleOptions"
            [value]="roleFilter"
            clearLabel="All roles"
            (valueChange)="selectRoleFilter($event)" />
        </div>
      </div>

      @if (loading()) {
        <div style="display:flex;flex-direction:column;gap:0;">
          @for (i of [1,2,3,4,5]; track i) {
            <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:12px;height:70px;margin-bottom:8px;animation:pulse 1.5s ease-in-out infinite;"></div>
          }
        </div>
      } @else {
        <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">

          @if (filtered().length === 0) {
            <div style="padding:64px 24px;text-align:center;">
              <p style="font-size:14px;color:#71767b;margin:0;">No users match your search.</p>
            </div>
          } @else {
            @for (u of filtered(); track u.userId; let last = $last) {
              <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;transition:background 120ms ease;cursor:default;"
                   [style.border-bottom]="last ? 'none' : '1px solid rgba(255,255,255,.04)'"
                   onmouseenter="this.style.background='rgba(255,255,255,.03)'"
                   onmouseleave="this.style.background='transparent'">

                <!-- Avatar + name/email -->
                <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
                  <div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;"
                       [style.background]="roleColor(u.role)">
                    {{ initials(u.fullName) }}
                  </div>
                  <div style="min-width:0;">
                    <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ u.fullName }}</p>
                    <p style="font-size:12px;color:#71767b;margin:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ u.email }}</p>
                  </div>
                </div>

                <!-- Role -->
                <div style="flex-shrink:0;width:90px;">
                  <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:.06em;text-transform:uppercase;"
                        [style.background]="roleColor(u.role) + '18'" [style.color]="roleColor(u.role)">{{ u.role }}</span>
                </div>

                <!-- Phone -->
                <div style="flex-shrink:0;width:120px;font-size:12px;color:#71767b;">{{ u.phone || '—' }}</div>

                <!-- Status -->
                <div style="flex-shrink:0;width:90px;display:flex;align-items:center;gap:6px;">
                  <div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;"
                       [style.background]="u.isActive ? '#00ba7c' : '#f4212e'"></div>
                  <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;"
                        [style.color]="u.isActive ? '#00ba7c' : '#f4212e'">{{ u.isActive ? 'Active' : 'Suspended' }}</span>
                </div>

                <!-- Joined -->
                <div style="flex-shrink:0;width:110px;font-size:12px;color:#71767b;">{{ u.createdAt | date:'dd MMM yyyy' }}</div>

                <!-- Actions -->
                <div style="flex-shrink:0;display:flex;gap:8px;">
                  <button (click)="openCompose(u)"
                          style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;background:rgba(29,155,240,.07);color:#1d9bf0;border:1px solid rgba(29,155,240,.15);transition:opacity 150ms;"
                          onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'"
                          title="Send email">
                    ✉
                  </button>
                  @if (u.role !== 'ADMIN') {
                    <button (click)="toggleUser(u)"
                            style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;border:none;transition:opacity 150ms;"
                            [style.background]="u.isActive ? 'rgba(244,33,46,.08)' : 'rgba(0,186,124,.08)'"
                            [style.color]="u.isActive ? '#f4212e' : '#00ba7c'"
                            onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">
                      {{ u.isActive ? 'Suspend' : 'Reactivate' }}
                    </button>
                    <button (click)="deleteUser(u)"
                            style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;background:rgba(244,33,46,.06);color:#f4212e;border:1px solid rgba(244,33,46,.15);transition:opacity 150ms;"
                            onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">
                      Delete
                    </button>
                  }
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- Compose email modal -->
      @if (compose()) {
        <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.78);backdrop-filter:blur(6px);">
          <div style="background:#0f0f0f;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;width:100%;max-width:480px;" class="anim-in">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
              <div style="width:38px;height:38px;border-radius:10px;background:rgba(29,155,240,.1);display:flex;align-items:center;justify-content:center;font-size:18px;">✉</div>
              <div>
                <h3 style="font-size:16px;font-weight:800;color:#e7e9ea;margin:0;">Send Email</h3>
                <p style="font-size:12px;color:#71767b;margin:0;">{{ compose()!.to }}</p>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div>
                <label style="display:block;font-size:11px;color:#71767b;font-weight:700;margin-bottom:6px;letter-spacing:.05em;text-transform:uppercase;">Subject</label>
                <input [(ngModel)]="compose()!.subject" type="text" placeholder="Subject…"
                       style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                       onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
              </div>
              <div>
                <label style="display:block;font-size:11px;color:#71767b;font-weight:700;margin-bottom:6px;letter-spacing:.05em;text-transform:uppercase;">Message</label>
                <textarea [(ngModel)]="compose()!.body" placeholder="Write your message…" rows="5"
                          style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;resize:vertical;transition:border-color 150ms;font-family:inherit;"
                          onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"></textarea>
              </div>
            </div>
            <div style="display:flex;gap:10px;margin-top:20px;">
              <button (click)="sendEmail()" [disabled]="sending()"
                      style="flex:1;padding:11px;border-radius:12px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                      [style.opacity]="sending() ? '.5' : '1'">
                {{ sending() ? 'Sending…' : 'Send Email' }}
              </button>
              <button (click)="compose.set(null)"
                      style="flex:1;padding:11px;border-radius:12px;background:rgba(255,255,255,.05);color:#e7e9ea;border:1px solid rgba(255,255,255,.08);font-size:14px;font-weight:600;cursor:pointer;">
                Cancel
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Confirm delete modal -->
      @if (confirmDelete()) {
        <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);">
          <div style="background:#0f0f0f;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;width:100%;max-width:360px;" class="anim-in">
            <div style="width:44px;height:44px;border-radius:12px;background:rgba(244,33,46,.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f4212e" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
              </svg>
            </div>
            <h3 style="font-size:16px;font-weight:800;color:#e7e9ea;margin:0 0 8px;">Delete User</h3>
            <p style="font-size:13px;color:#71767b;margin:0 0 24px;line-height:1.6;">
              Permanently delete <strong style="color:#e7e9ea;">{{ confirmDelete()!.fullName }}</strong>? This cannot be undone.
            </p>
            <div style="display:flex;gap:10px;">
              <button (click)="confirmDeleteUser()"
                      style="flex:1;padding:11px;border-radius:12px;background:rgba(244,33,46,.1);color:#f4212e;border:1px solid rgba(244,33,46,.2);font-size:14px;font-weight:700;cursor:pointer;transition:background 150ms;"
                      onmouseenter="this.style.background='rgba(244,33,46,.16)'" onmouseleave="this.style.background='rgba(244,33,46,.1)'">
                Delete
              </button>
              <button (click)="confirmDelete.set(null)"
                      style="flex:1;padding:11px;border-radius:12px;background:rgba(255,255,255,.05);color:#e7e9ea;border:1px solid rgba(255,255,255,.08);font-size:14px;font-weight:600;cursor:pointer;transition:background 150ms;"
                      onmouseenter="this.style.background='rgba(255,255,255,.09)'" onmouseleave="this.style.background='rgba(255,255,255,.05)'">
                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UsersComponent implements OnInit {
  private http  = inject(HttpClient);
  private toast = inject(ToastService);

  allUsers      = signal<User[]>([]);
  filteredList  = signal<User[]>([]);
  loading       = signal(true);
  confirmDelete = signal<User | null>(null);
  compose       = signal<ComposeEmail | null>(null);
  sending       = signal(false);
  search     = '';
  roleFilter = '';
  roleOptions: ThemeSelectOption[] = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Manager', value: 'MANAGER' },
    { label: 'Driver', value: 'DRIVER' },
  ];

  filtered = computed(() => this.filteredList());

  ngOnInit() {
    this.http.get<User[]>('/api/v1/admin/users').subscribe({
      next: u => { this.allUsers.set(u); this.filteredList.set(u); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load users.'); }
    });
  }

  applyFilter() {
    let r = this.allUsers();
    if (this.search) {
      const q = this.search.toLowerCase();
      r = r.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (this.roleFilter) r = r.filter(u => u.role === this.roleFilter);
    this.filteredList.set(r);
  }

  selectRoleFilter(role: string) {
    this.roleFilter = role;
    this.applyFilter();
  }

  toggleUser(u: User) {
    const action = u.isActive ? 'suspend' : 'reactivate';
    this.http.put(`/api/v1/admin/users/${u.userId}/${action}`, {}).subscribe({
      next: () => {
        this.allUsers.update(list => list.map(x => x.userId === u.userId ? { ...x, isActive: !x.isActive } : x));
        this.applyFilter();
        this.toast.success(`User ${u.isActive ? 'suspended' : 'reactivated'}.`);
      },
      error: err => this.toast.error(err?.error?.message ?? 'Action failed.')
    });
  }

  deleteUser(u: User) { this.confirmDelete.set(u); }

  openCompose(u: User) {
    this.compose.set({ to: u.email, subject: '', body: '' });
  }

  sendEmail() {
    const c = this.compose();
    if (!c || !c.subject.trim() || !c.body.trim()) return;
    this.sending.set(true);
    this.http.post('/api/v1/notifications/admin/email', { to: c.to, subject: c.subject, body: c.body }).subscribe({
      next: () => {
        this.compose.set(null);
        this.sending.set(false);
        this.toast.success('Email sent.');
      },
      error: err => {
        this.sending.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to send email.');
      }
    });
  }

  confirmDeleteUser() {
    const u = this.confirmDelete();
    if (!u) return;

    this.http.delete(`/api/v1/admin/users/${u.userId}`).subscribe({
      next: () => {
        // cascade: delete role-specific data then notifications
        const cascades: any[] = [];
        if (u.role === 'MANAGER') {
          cascades.push(this.http.delete(`/api/v1/parking/admin/manager/${u.userId}/lots`).subscribe({ error: () => {} }));
        }
        if (u.role === 'DRIVER') {
          cascades.push(this.http.delete(`/api/v1/bookings/admin/driver/${u.userId}`).subscribe({ error: () => {} }));
        }
        this.http.delete(`/api/v1/notifications/admin/recipient/${u.userId}/all`).subscribe({ error: () => {} });

        this.allUsers.update(list => list.filter(x => x.userId !== u.userId));
        this.applyFilter();
        this.confirmDelete.set(null);
        this.toast.success(`${u.fullName} deleted.`);
      },
      error: err => { this.confirmDelete.set(null); this.toast.error(err?.error?.message ?? 'Delete failed.'); }
    });
  }

  initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
  roleColor(r: string)   { return ROLE_COLOR[r] ?? '#1d9bf0'; }
}
