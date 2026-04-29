import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { VehicleService, AddVehicleRequest } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { Vehicle } from '../../core/models/parking.models';

@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease', style({ opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="p-6 space-y-6 page-host" @fadeUp>

      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 style="font-size:22px;font-weight:700;color:var(--text-primary);margin:0;">Vehicle Panel</h2>
          <p style="color:var(--text-secondary);font-size:14px;margin:4px 0 0;">
            {{ role === 'DRIVER' ? 'Manage your registered vehicles' : 'Look up vehicles by plate number' }}
          </p>
        </div>
        @if (role === 'DRIVER') {
          <button (click)="showForm.set(!showForm())"
                  class="btn-accent flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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
          <div class="card p-6" @fadeIn>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 16px;">Register a Vehicle</h3>
            <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">

              <div class="floating-group">
                <input [(ngModel)]="form.plate" type="text" id="vplate" placeholder=" "
                       style="text-transform:uppercase;" (input)="form.plate = form.plate.toUpperCase()"/>
                <label for="vplate">Plate Number *</label>
              </div>

              <div>
                <p style="font-size:12px;color:var(--text-secondary);margin:0 0 6px;">Vehicle Type *</p>
                <select [(ngModel)]="form.vehicleType"
                        class="w-full px-3 py-3 rounded-xl"
                        style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;font-size:14px;">
                  @for (t of vehicleTypes; track t) {
                    <option [value]="t">{{ t }}</option>
                  }
                </select>
              </div>

              <div class="floating-group">
                <input [(ngModel)]="form.nickname" type="text" id="vnick" placeholder=" "/>
                <label for="vnick">Nickname (optional)</label>
              </div>

              <div class="flex items-center gap-3 pt-2">
                <button (click)="form.ev = !form.ev"
                        class="w-10 h-6 rounded-full flex items-center transition-all relative"
                        [style.background]="form.ev ? 'var(--accent)' : 'var(--border)'"
                        style="border:none;cursor:pointer;padding:2px;">
                  <span class="w-5 h-5 rounded-full bg-white block transition-all"
                        [style.transform]="form.ev ? 'translateX(16px)' : 'translateX(0)'"></span>
                </button>
                <span style="font-size:14px;color:var(--text-primary);">Electric Vehicle (EV)</span>
              </div>
            </div>

            @if (formError()) {
              <p class="mt-3" style="font-size:13px;color:#f4212e;" @fadeIn>{{ formError() }}</p>
            }

            <div class="flex gap-3 mt-5">
              <button (click)="addVehicle()" [disabled]="saving()"
                      class="btn-accent"
                      [style.opacity]="saving() ? '.6' : '1'">
                {{ saving() ? 'Saving…' : 'Register Vehicle' }}
              </button>
              <button (click)="showForm.set(false)"
                      style="padding:10px 20px;border-radius:9999px;border:1px solid var(--border);
                             background:transparent;color:var(--text-secondary);cursor:pointer;font-size:14px;">
                Cancel
              </button>
            </div>
          </div>
        }

        <!-- Vehicle list -->
        @if (loading()) {
          <div class="grid gap-4" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));">
            @for (i of [1,2,3]; track i) {
              <div class="card p-5 animate-pulse">
                <div class="h-4 rounded" style="background:var(--bg-hover);width:60%;margin-bottom:8px;"></div>
                <div class="h-3 rounded" style="background:var(--bg-hover);width:40%;"></div>
              </div>
            }
          </div>
        } @else if (vehicles().length === 0) {
          <div class="card p-12 flex flex-col items-center text-center" @fadeUp>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.5" class="mb-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
            </svg>
            <p style="font-size:15px;font-weight:600;color:var(--text-primary);margin:0 0 4px;">No vehicles yet</p>
            <p style="font-size:13px;color:var(--text-secondary);margin:0;">Register a vehicle to start booking parking spots.</p>
          </div>
        } @else {
          <div class="grid gap-4" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));" @fadeUp>
            @for (v of vehicles(); track v.id) {
              <div class="card p-5 flex items-start gap-4">
                <!-- Vehicle icon -->
                <div class="rounded-2xl flex items-center justify-center flex-shrink-0"
                     style="width:52px;height:52px;background:var(--accent-dim);">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                  </svg>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <p style="font-size:16px;font-weight:800;color:var(--text-primary);margin:0;letter-spacing:.5px;">
                      {{ v.plate }}
                    </p>
                    @if (v.ev) {
                      <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:9999px;background:rgba(0,186,124,.12);color:#00ba7c;">EV</span>
                    }
                  </div>
                  <p style="font-size:13px;color:var(--text-secondary);margin:0;">
                    {{ v.vehicleType }}
                    @if (v.nickname) { · {{ v.nickname }} }
                  </p>
                  <p style="font-size:11px;color:var(--text-secondary);margin:4px 0 0;opacity:.6;">
                    Added {{ v.createdAt | date:'dd MMM yyyy' }}
                  </p>
                </div>

                <button (click)="deleteVehicle(v.id)"
                        style="background:none;border:none;cursor:pointer;padding:6px;border-radius:8px;color:var(--text-secondary);transition:color 160ms,background 160ms;"
                        onmouseenter="this.style.color='#f4212e';this.style.background='rgba(244,33,46,.08)'"
                        onmouseleave="this.style.color='var(--text-secondary)';this.style.background='none'">
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
        <div class="card p-6" @fadeUp>
          <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 16px;">Plate Number Lookup</h3>
          <div class="flex gap-3">
            <div class="floating-group flex-1" style="max-width:300px;">
              <input [(ngModel)]="lookupPlate" type="text" id="lookup" placeholder=" "
                     style="text-transform:uppercase;" (input)="lookupPlate = lookupPlate.toUpperCase()"
                     (keydown.enter)="lookupByPlate()"/>
              <label for="lookup">Enter Plate Number</label>
            </div>
            <button (click)="lookupByPlate()" [disabled]="lookupLoading()"
                    class="btn-accent" [style.opacity]="lookupLoading() ? '.6' : '1'">
              {{ lookupLoading() ? 'Searching…' : 'Search' }}
            </button>
          </div>

          @if (lookupError()) {
            <p class="mt-3" style="font-size:13px;color:#f4212e;" @fadeIn>{{ lookupError() }}</p>
          }

          @if (lookupResult()) {
            <div class="mt-5 p-4 rounded-2xl flex items-center gap-4" @fadeIn
                 style="background:var(--bg-secondary);border:1px solid var(--border);">
              <div class="rounded-2xl flex items-center justify-center"
                   style="width:48px;height:48px;background:var(--accent-dim);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                </svg>
              </div>
              <div>
                <p style="font-size:16px;font-weight:800;color:var(--text-primary);margin:0;">{{ lookupResult()!.plate }}</p>
                <p style="font-size:13px;color:var(--text-secondary);margin:2px 0 0;">
                  {{ lookupResult()!.vehicleType }}
                  @if (lookupResult()!.nickname) { · {{ lookupResult()!.nickname }} }
                  @if (lookupResult()!.ev) { · <span style="color:#00ba7c;">EV</span> }
                </p>
              </div>
            </div>
          }
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
