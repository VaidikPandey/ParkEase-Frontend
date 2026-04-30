import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService, AddVehicleRequest } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { Vehicle } from '../../core/models/parking.models';

@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width:900px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header -->
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <h1 style="font-size:22px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.3px;">Vehicle Panel</h1>
          <p style="font-size:13px;color:#71767b;margin:0;">
            {{ role === 'DRIVER' ? 'Manage your registered vehicles' : 'Look up vehicles by plate number' }}
          </p>
        </div>
        @if (role === 'DRIVER') {
          <button (click)="showForm.set(!showForm())"
                  style="padding:9px 18px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:opacity 150ms;"
                  onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Add Vehicle
          </button>
        }
      </div>

      <!-- ── DRIVER VIEW ── -->
      @if (role === 'DRIVER') {

        <!-- Add vehicle form -->
        @if (showForm()) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:20px;" class="anim-in anim-d1">
            <div style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
              <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">Register a Vehicle</p>
            </div>
            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;">
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Plate Number <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="form.plate" type="text" placeholder="e.g. MH01AB1234"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;text-transform:uppercase;transition:border-color 150ms;"
                         (input)="form.plate = form.plate.toUpperCase()"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Vehicle Type <span style="color:#f4212e;">*</span></label>
                  <select [(ngModel)]="form.vehicleType"
                          style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;cursor:pointer;">
                    @for (t of vehicleTypes; track t) {
                      <option [value]="t" style="background:#1c1c1c;">{{ t }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Nickname <span style="color:#536471;font-weight:400;">(optional)</span></label>
                  <input [(ngModel)]="form.nickname" type="text" placeholder="e.g. My Daily"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div style="display:flex;align-items:center;gap:12px;padding-top:4px;">
                  <button (click)="form.ev = !form.ev"
                          style="width:40px;height:22px;border-radius:9999px;border:none;cursor:pointer;padding:2px;transition:background 200ms;flex-shrink:0;display:flex;align-items:center;"
                          [style.background]="form.ev ? '#1d9bf0' : 'rgba(255,255,255,.15)'">
                    <span style="width:18px;height:18px;border-radius:50%;background:#fff;display:block;transition:transform 200ms;"
                          [style.transform]="form.ev ? 'translateX(18px)' : 'translateX(0)'"></span>
                  </button>
                  <span style="font-size:14px;color:#e7e9ea;">Electric Vehicle (EV)</span>
                </div>
              </div>

              @if (formError()) {
                <p style="font-size:13px;color:#f4212e;margin:0;">{{ formError() }}</p>
              }

              <div style="display:flex;gap:10px;">
                <button (click)="addVehicle()" [disabled]="saving()"
                        style="padding:10px 22px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                        [style.opacity]="saving() ? '.5' : '1'">
                  {{ saving() ? 'Saving…' : 'Register Vehicle' }}
                </button>
                <button (click)="showForm.set(false)"
                        style="padding:10px 20px;border-radius:9999px;background:rgba(255,255,255,.05);color:#71767b;border:1px solid rgba(255,255,255,.08);font-size:14px;cursor:pointer;">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Loading -->
        @if (loading()) {
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
            @for (i of [1,2,3]; track i) {
              <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:14px;height:90px;animation:pulse 1.5s ease-in-out infinite;"></div>
            }
          </div>
        } @else if (vehicles().length === 0) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:64px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;" class="anim-in anim-d1">
            <div style="width:52px;height:52px;border-radius:50%;background:rgba(29,155,240,.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
              </svg>
            </div>
            <p style="font-size:15px;font-weight:700;color:#e7e9ea;margin:0 0 6px;">No vehicles yet</p>
            <p style="font-size:13px;color:#71767b;margin:0;">Register a vehicle to start booking parking spots.</p>
          </div>
        } @else {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">
            @for (v of vehicles(); track v.id; let last = $last) {
              <div style="display:flex;align-items:center;gap:14px;padding:16px 20px;transition:background 120ms ease;cursor:default;"
                   [style.border-bottom]="last ? 'none' : '1px solid rgba(255,255,255,.04)'"
                   onmouseenter="this.style.background='rgba(255,255,255,.03)'"
                   onmouseleave="this.style.background='transparent'">
                <!-- Icon -->
                <div style="width:44px;height:44px;border-radius:12px;background:rgba(29,155,240,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                  </svg>
                </div>
                <!-- Info -->
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    <p style="font-size:15px;font-weight:800;color:#e7e9ea;margin:0;letter-spacing:.5px;">{{ v.plate }}</p>
                    @if (v.ev) {
                      <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;background:rgba(0,186,124,.12);color:#00ba7c;letter-spacing:.05em;">EV</span>
                    }
                  </div>
                  <p style="font-size:12px;color:#71767b;margin:0;">
                    {{ v.vehicleType }}{{ v.nickname ? ' · ' + v.nickname : '' }}
                  </p>
                  <p style="font-size:11px;color:#536471;margin:3px 0 0;">Added {{ v.createdAt | date:'dd MMM yyyy' }}</p>
                </div>
                <!-- Delete -->
                <button (click)="deleteVehicle(v.id)"
                        style="background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;color:#536471;transition:color 150ms,background 150ms;display:flex;align-items:center;"
                        onmouseenter="this.style.color='#f4212e';this.style.background='rgba(244,33,46,.08)'"
                        onmouseleave="this.style.color='#536471';this.style.background='transparent'">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      }

      <!-- ── ADMIN / MANAGER VIEW — Plate Lookup ── -->
      @if (role === 'ADMIN' || role === 'MANAGER') {
        <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">
          <div style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
            <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">Plate Number Lookup</p>
          </div>
          <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px;">
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
              <div style="position:relative;flex:1;max-width:300px;">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#71767b" stroke-width="2"
                     style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"/>
                </svg>
                <input [(ngModel)]="lookupPlate" type="text" placeholder="Enter plate number"
                       style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px 11px 34px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;text-transform:uppercase;transition:border-color 150ms;"
                       (input)="lookupPlate = lookupPlate.toUpperCase()"
                       (keydown.enter)="lookupByPlate()"
                       onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
              </div>
              <button (click)="lookupByPlate()" [disabled]="lookupLoading()"
                      style="padding:11px 22px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                      [style.opacity]="lookupLoading() ? '.5' : '1'">
                {{ lookupLoading() ? 'Searching…' : 'Search' }}
              </button>
            </div>

            @if (lookupError()) {
              <p style="font-size:13px;color:#f4212e;margin:0;">{{ lookupError() }}</p>
            }

            @if (lookupResult()) {
              <div style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;background:rgba(29,155,240,.05);border:1px solid rgba(29,155,240,.15);">
                <div style="width:44px;height:44px;border-radius:12px;background:rgba(29,155,240,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                  </svg>
                </div>
                <div>
                  <p style="font-size:16px;font-weight:800;color:#e7e9ea;margin:0 0 2px;letter-spacing:.5px;">{{ lookupResult()!.plate }}</p>
                  <p style="font-size:13px;color:#71767b;margin:0;">
                    {{ lookupResult()!.vehicleType }}
                    @if (lookupResult()!.nickname) { · {{ lookupResult()!.nickname }} }
                    @if (lookupResult()!.ev) { · <span style="color:#00ba7c;font-weight:600;">EV</span> }
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `
})
export class VehicleComponent implements OnInit {
  private vehicleSvc = inject(VehicleService);
  private auth       = inject(AuthService);

  role = this.auth.currentUser()?.role;

  vehicles    = signal<Vehicle[]>([]);
  loading     = signal(true);
  showForm    = signal(false);
  saving      = signal(false);
  formError   = signal('');

  lookupPlate   = '';
  lookupLoading = signal(false);
  lookupResult  = signal<Vehicle | null>(null);
  lookupError   = signal('');

  vehicleTypes = ['SEDAN', 'SUV', 'MOTORCYCLE', 'TRUCK', 'VAN', 'OTHER'];

  form: AddVehicleRequest & { nickname: string } = {
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
      error: () => this.loading.set(false)
    });
  }

  addVehicle() {
    if (!this.form.plate.trim()) { this.formError.set('Plate number is required.'); return; }
    this.saving.set(true);
    this.formError.set('');
    this.vehicleSvc.addVehicle({
      plate: this.form.plate.trim(),
      vehicleType: this.form.vehicleType,
      ev: this.form.ev,
      nickname: this.form.nickname.trim() || undefined
    }).subscribe({
      next: v => {
        this.vehicles.update(list => [v, ...list]);
        this.form = { plate: '', vehicleType: 'SEDAN', ev: false, nickname: '' };
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: err => {
        this.formError.set(err?.error?.message ?? 'Failed to add vehicle.');
        this.saving.set(false);
      }
    });
  }

  deleteVehicle(id: number) {
    this.vehicleSvc.deleteVehicle(id).subscribe({
      next: () => this.vehicles.update(list => list.filter(v => v.id !== id))
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
}
