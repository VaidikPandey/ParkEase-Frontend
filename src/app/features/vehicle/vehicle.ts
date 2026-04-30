import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService, AddVehicleRequest } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Vehicle } from '../../core/models/parking.models';

const TYPE_ICON: Record<string, string> = {
  SEDAN: '🚗', SUV: '🚙', MOTORCYCLE: '🏍️', TRUCK: '🚛', VAN: '🚐', OTHER: '🚘'
};

@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width:900px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header -->
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <h1 style="font-size:22px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.3px;">
            {{ role === 'DRIVER' ? 'My Vehicles' : 'Vehicle Lookup' }}
          </h1>
          <p style="font-size:13px;color:#71767b;margin:0;">
            {{ role === 'DRIVER' ? 'Manage your registered vehicles' : 'Search any vehicle by plate number' }}
          </p>
        </div>
        @if (role === 'DRIVER') {
          <button (click)="showForm.set(!showForm())"
                  style="padding:9px 18px;border-radius:9999px;font-size:13px;font-weight:700;cursor:pointer;border:none;display:flex;align-items:center;gap:7px;transition:opacity 150ms;"
                  [style.background]="showForm() ? 'rgba(255,255,255,.08)' : '#1d9bf0'"
                  [style.color]="showForm() ? '#71767b' : '#fff'"
                  onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
            @if (!showForm()) {
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              Add Vehicle
            } @else {
              Cancel
            }
          </button>
        }
      </div>

      <!-- ── DRIVER VIEW ── -->
      @if (role === 'DRIVER') {

        <!-- Add vehicle form -->
        @if (showForm()) {
          <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;margin-bottom:20px;" class="anim-in">
            <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px;">
              <div style="width:7px;height:7px;border-radius:50%;background:#1d9bf0;"></div>
              <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">Register New Vehicle</p>
            </div>
            <div style="padding:20px;display:flex;flex-direction:column;gap:16px;">

              <!-- Vehicle type selector -->
              <div>
                <label style="display:block;font-size:11px;color:#71767b;font-weight:700;margin-bottom:10px;letter-spacing:.06em;text-transform:uppercase;">Vehicle Type</label>
                <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;">
                  @for (t of vehicleTypes; track t.value) {
                    <button (click)="form.vehicleType = t.value"
                            style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 6px;border-radius:12px;cursor:pointer;border:1.5px solid;transition:all 150ms;font-size:11px;font-weight:700;"
                            [style.border-color]="form.vehicleType === t.value ? '#1d9bf0' : 'rgba(255,255,255,.08)'"
                            [style.background]="form.vehicleType === t.value ? 'rgba(29,155,240,.1)' : 'rgba(255,255,255,.02)'"
                            [style.color]="form.vehicleType === t.value ? '#1d9bf0' : '#71767b'">
                      <span style="font-size:18px;">{{ t.icon }}</span>
                      <span>{{ t.label }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Plate + Nickname -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                  <label style="display:block;font-size:11px;color:#71767b;font-weight:700;margin-bottom:8px;letter-spacing:.06em;text-transform:uppercase;">Plate Number <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="form.plate" type="text" placeholder="MH01AB1234"
                         (input)="form.plate = form.plate.toUpperCase()" maxlength="15"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;font-family:monospace;letter-spacing:.08em;text-transform:uppercase;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:11px;color:#71767b;font-weight:700;margin-bottom:8px;letter-spacing:.06em;text-transform:uppercase;">Nickname <span style="color:#536471;font-weight:400;">(optional)</span></label>
                  <input [(ngModel)]="form.nickname" type="text" placeholder="e.g. My Daily Ride"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
              </div>

              <!-- EV toggle -->
              <div style="display:flex;align-items:center;gap:12px;">
                <button (click)="form.ev = !form.ev"
                        style="width:42px;height:24px;border-radius:9999px;border:none;cursor:pointer;padding:3px;transition:background 200ms;flex-shrink:0;display:flex;align-items:center;"
                        [style.background]="form.ev ? '#1d9bf0' : 'rgba(255,255,255,.15)'">
                  <span style="width:18px;height:18px;border-radius:50%;background:#fff;display:block;transition:transform 200ms;flex-shrink:0;"
                        [style.transform]="form.ev ? 'translateX(18px)' : 'translateX(0)'"></span>
                </button>
                <div>
                  <span style="font-size:14px;color:#e7e9ea;font-weight:600;">Electric Vehicle</span>
                  <span style="font-size:12px;color:#71767b;margin-left:6px;">Eligible for EV-only spots</span>
                </div>
              </div>

              @if (formError()) {
                <p style="font-size:13px;color:#f4212e;margin:0;display:flex;align-items:center;gap:6px;">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                  {{ formError() }}
                </p>
              }

              <div style="display:flex;gap:10px;padding-top:4px;">
                <button (click)="addVehicle()" [disabled]="saving()"
                        style="padding:10px 24px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                        [style.opacity]="saving() ? '.5' : '1'">
                  {{ saving() ? 'Registering…' : 'Register Vehicle' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Vehicle list -->
        @if (loading()) {
          <div style="display:flex;flex-direction:column;gap:8px;">
            @for (i of [1,2,3]; track i) {
              <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:14px;height:76px;animation:pulse 1.5s ease-in-out infinite;"></div>
            }
          </div>
        } @else if (vehicles().length === 0 && !showForm()) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:64px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;" class="anim-in">
            <div style="font-size:40px;margin-bottom:12px;">🚗</div>
            <p style="font-size:15px;font-weight:700;color:#e7e9ea;margin:0 0 6px;">No vehicles registered</p>
            <p style="font-size:13px;color:#71767b;margin:0 0 20px;">Add your first vehicle to start booking spots.</p>
            <button (click)="showForm.set(true)"
                    style="padding:9px 22px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;">
              Add Vehicle
            </button>
          </div>
        } @else if (vehicles().length > 0) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">
            @for (v of vehicles(); track v.id; let last = $last) {
              <div style="display:flex;align-items:center;gap:14px;padding:16px 20px;transition:background 120ms ease;"
                   [style.border-bottom]="last ? 'none' : '1px solid rgba(255,255,255,.04)'"
                   onmouseenter="this.style.background='rgba(255,255,255,.03)'"
                   onmouseleave="this.style.background='transparent'">

                <!-- Icon -->
                <div style="width:46px;height:46px;border-radius:13px;background:rgba(29,155,240,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;border:1px solid rgba(29,155,240,.15);">
                  {{ typeIcon(v.vehicleType) }}
                </div>

                <!-- Info -->
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px;">
                    <p style="font-size:15px;font-weight:800;color:#e7e9ea;margin:0;font-family:monospace;letter-spacing:.06em;">{{ v.plate }}</p>
                    <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;letter-spacing:.05em;text-transform:uppercase;background:rgba(255,255,255,.06);color:#71767b;">{{ v.vehicleType }}</span>
                    @if (v.ev) {
                      <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(0,186,124,.12);color:#00ba7c;letter-spacing:.05em;">⚡ EV</span>
                    }
                  </div>
                  <p style="font-size:12px;color:#71767b;margin:0;">
                    {{ v.nickname || 'No nickname' }} · Added {{ v.createdAt | date:'dd MMM yyyy' }}
                  </p>
                </div>

                <!-- Delete -->
                <button (click)="confirmRemove.set(v)"
                        style="background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;color:#536471;transition:color 150ms,background 150ms;display:flex;align-items:center;"
                        onmouseenter="this.style.color='#f4212e';this.style.background='rgba(244,33,46,.08)'"
                        onmouseleave="this.style.color='#536471';this.style.background='transparent'"
                        title="Remove vehicle">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      }

      <!-- ── ADMIN / MANAGER VIEW ── -->
      @if (role === 'ADMIN' || role === 'MANAGER') {
        <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">
          <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px;">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#71767b" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"/>
            </svg>
            <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">Search by Plate Number</p>
          </div>
          <div style="padding:20px;display:flex;flex-direction:column;gap:16px;">
            <div style="display:flex;gap:10px;align-items:center;">
              <input [(ngModel)]="lookupPlate" type="text" placeholder="e.g. MH01AB1234"
                     (input)="lookupPlate = lookupPlate.toUpperCase()"
                     (keydown.enter)="lookupByPlate()"
                     style="flex:1;max-width:320px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;font-family:monospace;letter-spacing:.06em;text-transform:uppercase;transition:border-color 150ms;"
                     onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
              <button (click)="lookupByPlate()" [disabled]="lookupLoading()"
                      style="padding:11px 22px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;white-space:nowrap;"
                      [style.opacity]="lookupLoading() ? '.5' : '1'">
                {{ lookupLoading() ? 'Searching…' : 'Search' }}
              </button>
            </div>

            @if (lookupError()) {
              <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:10px;background:rgba(244,33,46,.06);border:1px solid rgba(244,33,46,.15);">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f4212e" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                <span style="font-size:13px;color:#f4212e;font-weight:600;">{{ lookupError() }}</span>
              </div>
            }

            @if (lookupResult()) {
              <div style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;background:rgba(29,155,240,.05);border:1px solid rgba(29,155,240,.15);" class="anim-in">
                <div style="width:46px;height:46px;border-radius:13px;background:rgba(29,155,240,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;border:1px solid rgba(29,155,240,.2);">
                  {{ typeIcon(lookupResult()!.vehicleType) }}
                </div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                    <p style="font-size:16px;font-weight:800;color:#e7e9ea;margin:0;font-family:monospace;letter-spacing:.06em;">{{ lookupResult()!.plate }}</p>
                    <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,.06);color:#71767b;text-transform:uppercase;">{{ lookupResult()!.vehicleType }}</span>
                    @if (lookupResult()!.ev) {
                      <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(0,186,124,.12);color:#00ba7c;">⚡ EV</span>
                    }
                  </div>
                  <p style="font-size:13px;color:#71767b;margin:0;">
                    {{ lookupResult()!.nickname || 'No nickname' }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Delete confirm modal -->
      @if (confirmRemove()) {
        <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);">
          <div style="background:#0f0f0f;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;width:100%;max-width:340px;" class="anim-in">
            <div style="width:44px;height:44px;border-radius:12px;background:rgba(244,33,46,.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:22px;">
              🗑️
            </div>
            <h3 style="font-size:16px;font-weight:800;color:#e7e9ea;margin:0 0 8px;">Remove Vehicle</h3>
            <p style="font-size:13px;color:#71767b;margin:0 0 24px;line-height:1.6;">
              Remove <strong style="color:#e7e9ea;font-family:monospace;">{{ confirmRemove()!.plate }}</strong> from your account?
            </p>
            <div style="display:flex;gap:10px;">
              <button (click)="deleteVehicle(confirmRemove()!.id)"
                      style="flex:1;padding:11px;border-radius:12px;background:rgba(244,33,46,.1);color:#f4212e;border:1px solid rgba(244,33,46,.2);font-size:14px;font-weight:700;cursor:pointer;transition:background 150ms;"
                      onmouseenter="this.style.background='rgba(244,33,46,.18)'" onmouseleave="this.style.background='rgba(244,33,46,.1)'">
                Remove
              </button>
              <button (click)="confirmRemove.set(null)"
                      style="flex:1;padding:11px;border-radius:12px;background:rgba(255,255,255,.05);color:#e7e9ea;border:1px solid rgba(255,255,255,.08);font-size:14px;font-weight:600;cursor:pointer;">
                Cancel
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class VehicleComponent implements OnInit {
  private vehicleSvc = inject(VehicleService);
  private auth       = inject(AuthService);
  private toast      = inject(ToastService);

  role = this.auth.currentUser()?.role;

  vehicles      = signal<Vehicle[]>([]);
  loading       = signal(true);
  showForm      = signal(false);
  saving        = signal(false);
  formError     = signal('');
  confirmRemove = signal<Vehicle | null>(null);

  lookupPlate   = '';
  lookupLoading = signal(false);
  lookupResult  = signal<Vehicle | null>(null);
  lookupError   = signal('');

  vehicleTypes = [
    { value: 'SEDAN',      label: 'Sedan',  icon: '🚗' },
    { value: 'SUV',        label: 'SUV',    icon: '🚙' },
    { value: 'MOTORCYCLE', label: 'Moto',   icon: '🏍️' },
    { value: 'TRUCK',      label: 'Truck',  icon: '🚛' },
    { value: 'VAN',        label: 'Van',    icon: '🚐' },
    { value: 'OTHER',      label: 'Other',  icon: '🚘' },
  ];

  form: { plate: string; vehicleType: string; ev: boolean; nickname: string } = {
    plate: '', vehicleType: 'SEDAN', ev: false, nickname: ''
  };

  ngOnInit() {
    if (this.role === 'DRIVER') this.loadVehicles();
    else this.loading.set(false);
  }

  loadVehicles() {
    this.loading.set(true);
    this.vehicleSvc.getMyVehicles().subscribe({
      next: v => { this.vehicles.set(v); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load vehicles.'); }
    });
  }

  addVehicle() {
    if (!this.form.plate.trim()) { this.formError.set('Plate number is required.'); return; }
    this.saving.set(true);
    this.formError.set('');
    const req: AddVehicleRequest = {
      plate: this.form.plate.trim(),
      vehicleType: this.form.vehicleType,
      ev: this.form.ev,
      nickname: this.form.nickname.trim() || undefined
    };
    this.vehicleSvc.addVehicle(req).subscribe({
      next: v => {
        this.vehicles.update(list => [v, ...list]);
        this.form = { plate: '', vehicleType: 'SEDAN', ev: false, nickname: '' };
        this.showForm.set(false);
        this.saving.set(false);
        this.toast.success('Vehicle registered.');
      },
      error: err => {
        this.formError.set(err?.error?.message ?? 'Failed to register vehicle.');
        this.saving.set(false);
      }
    });
  }

  deleteVehicle(id: number) {
    this.vehicleSvc.deleteVehicle(id).subscribe({
      next: () => {
        this.vehicles.update(list => list.filter(v => v.id !== id));
        this.confirmRemove.set(null);
        this.toast.success('Vehicle removed.');
      },
      error: err => {
        this.confirmRemove.set(null);
        this.toast.error(err?.error?.message ?? 'Failed to remove vehicle.');
      }
    });
  }

  lookupByPlate() {
    if (!this.lookupPlate.trim()) return;
    this.lookupLoading.set(true);
    this.lookupError.set('');
    this.lookupResult.set(null);
    this.vehicleSvc.getByPlate(this.lookupPlate.trim()).subscribe({
      next: v => { this.lookupResult.set(v); this.lookupLoading.set(false); },
      error: () => { this.lookupError.set('No vehicle found with that plate.'); this.lookupLoading.set(false); }
    });
  }

  typeIcon(type: string) { return TYPE_ICON[type] ?? '🚘'; }
}
