import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../core/services/toast.service';

interface User {
  userId: number; fullName: string; email: string; role: string;
  phone: string; isActive: boolean; createdAt: string;
}

const ROLE_COLOR: Record<string, string> = { ADMIN:'#f4212e', MANAGER:'#ffd400', DRIVER:'#00ba7c' };

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(16px)' }), animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))])])
  ],
  template: `
    <div class="p-6 space-y-5 page-host" @fadeUp>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 style="font-size:22px;font-weight:700;color:var(--text-primary);margin:0;">User Management</h2>
          <p style="color:var(--text-secondary);font-size:14px;margin:4px 0 0;">{{ filtered().length }} users</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <div class="floating-group" style="margin:0;min-width:200px;">
            <input [(ngModel)]="search" type="text" id="usearch" placeholder=" " (ngModelChange)="applyFilter()"/>
            <label for="usearch">Search name / email</label>
          </div>
          <select [(ngModel)]="roleFilter" (ngModelChange)="applyFilter()"
                  class="px-3 py-2 rounded-xl text-sm"
                  style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);outline:none;">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="DRIVER">Driver</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-2">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="card p-4 animate-pulse" style="height:64px;"></div>
          }
        </div>
      } @else {
        <div class="card overflow-hidden" @fadeUp>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:1px solid var(--border);">
                  @for (h of headers; track h) {
                    <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">{{ h }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (u of filtered(); track u.userId) {
                  <tr style="border-bottom:1px solid var(--border);transition:background 120ms;"
                      onmouseenter="this.style.background='var(--bg-hover)'"
                      onmouseleave="this.style.background='transparent'">
                    <td style="padding:12px 16px;">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                             style="background:var(--accent-dim);color:var(--accent);">
                          {{ initials(u.fullName) }}
                        </div>
                        <div>
                          <p style="font-size:13px;font-weight:700;color:var(--text-primary);margin:0;">{{ u.fullName }}</p>
                          <p style="font-size:11px;color:var(--text-secondary);margin:0;">{{ u.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td style="padding:12px 16px;">
                      <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                            [style.background]="roleColor(u.role) + '18'"
                            [style.color]="roleColor(u.role)">{{ u.role }}</span>
                    </td>
                    <td style="padding:12px 16px;font-size:12px;color:var(--text-secondary);">{{ u.phone || '—' }}</td>
                    <td style="padding:12px 16px;">
                      <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                            [style.background]="u.isActive ? 'rgba(0,186,124,.1)' : 'rgba(244,33,46,.1)'"
                            [style.color]="u.isActive ? '#00ba7c' : '#f4212e'">
                        {{ u.isActive ? 'Active' : 'Suspended' }}
                      </span>
                    </td>
                    <td style="padding:12px 16px;font-size:12px;color:var(--text-secondary);">{{ u.createdAt | date:'dd MMM yyyy' }}</td>
                    <td style="padding:12px 16px;">
                      <div class="flex gap-2">
                        @if (u.role !== 'ADMIN') {
                          <button (click)="toggleUser(u)"
                                  class="text-xs px-3 py-1.5 rounded-full font-semibold"
                                  [style.background]="u.isActive ? 'rgba(244,33,46,.08)' : 'rgba(0,186,124,.08)'"
                                  [style.color]="u.isActive ? '#f4212e' : '#00ba7c'"
                                  style="border:none;cursor:pointer;">
                            {{ u.isActive ? 'Suspend' : 'Reactivate' }}
                          </button>
                          <button (click)="deleteUser(u)"
                                  class="text-xs px-3 py-1.5 rounded-full font-semibold"
                                  style="background:rgba(244,33,46,.06);color:#f4212e;border:1px solid rgba(244,33,46,.15);cursor:pointer;">
                            Delete
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            @if (filtered().length === 0) {
              <div class="py-12 text-center">
                <p style="font-size:14px;color:var(--text-secondary);">No users match your search.</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Confirm delete modal -->
      @if (confirmDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
             style="background:rgba(0,0,0,.6);backdrop-filter:blur(4px);">
          <div class="card p-6 w-full" style="max-width:380px;">
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 8px;">Delete User</h3>
            <p style="font-size:13px;color:var(--text-secondary);margin:0 0 20px;">
              Permanently delete <strong style="color:var(--text-primary);">{{ confirmDelete()!.fullName }}</strong>? This cannot be undone.
            </p>
            <div class="flex gap-3">
              <button (click)="confirmDeleteUser()"
                      class="flex-1 py-2.5 rounded-xl text-sm font-bold"
                      style="background:rgba(244,33,46,.1);color:#f4212e;border:1px solid rgba(244,33,46,.2);cursor:pointer;">
                Delete
              </button>
              <button (click)="confirmDelete.set(null)"
                      class="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                      style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;">
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

  headers = ['User', 'Role', 'Phone', 'Status', 'Joined', 'Actions'];
  allUsers     = signal<User[]>([]);
  filteredList = signal<User[]>([]);
  loading      = signal(true);
  confirmDelete = signal<User | null>(null);
  search     = '';
  roleFilter = '';

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

  confirmDeleteUser() {
    const u = this.confirmDelete();
    if (!u) return;
    this.http.delete(`/api/v1/admin/users/${u.userId}`).subscribe({
      next: () => {
        this.allUsers.update(list => list.filter(x => x.userId !== u.userId));
        this.applyFilter();
        this.confirmDelete.set(null);
        this.toast.success(`${u.fullName} deleted.`);
      },
      error: err => { this.confirmDelete.set(null); this.toast.error(err?.error?.message ?? 'Delete failed.'); }
    });
  }

  initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(); }
  roleColor(r: string)   { return ROLE_COLOR[r] ?? 'var(--accent)'; }
}
