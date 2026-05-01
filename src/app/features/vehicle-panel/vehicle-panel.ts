import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { VehicleService, AddVehicleRequest } from '../../core/services/vehicle.service';
import { Vehicle } from '../../core/models/parking.models';

type VehicleType = 'SEDAN' | 'SUV' | 'MOTORCYCLE' | 'TRUCK' | 'VAN' | 'OTHER';

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'SEDAN',      label: 'Sedan'      },
  { value: 'SUV',        label: 'SUV'        },
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
  { value: 'TRUCK',      label: 'Truck'      },
  { value: 'VAN',        label: 'Van'        },
  { value: 'OTHER',      label: 'Other'      },
];

function vehicleIcon(type: string): string {
  switch (type) {
    case 'SEDAN':      return 'M8 17a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2zm-9-4h10l1-4H6l1 4zM4 9l1-3h14l1 3';
    case 'SUV':        return 'M5 17a1 1 0 102 0 1 1 0 00-2 0zm12 0a1 1 0 102 0 1 1 0 00-2 0zM3 10l2-6h14l2 6v6H3v-6zm2 0h14';
    case 'MOTORCYCLE': return 'M5 17a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4zM9 10h6l2 4H7l2-4zm3-6l3 6';
    case 'TRUCK':      return 'M1 3h13v10H1V3zm13 3h4l2 4v3h-6V6zM6 17a1 1 0 100-2 1 1 0 000 2zm13 0a1 1 0 100-2 1 1 0 000 2z';
    case 'VAN':        return 'M3 9l2-6h14l2 6v7H3V9zm0 0h18M8 16a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z';
    default:           return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
  }
}

@Component({
  selector: 'app-vehicle-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('180ms ease', style({ opacity: 1 }))])]),
    trigger('slideUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(12px)' }), animate('240ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
    trigger('scaleIn', [transition(':enter', [style({ opacity: 0, transform: 'scale(.95)' }), animate('220ms cubic-bezier(.34,1.56,.64,1)', style({ opacity: 1, transform: 'scale(1)' }))])]),
  ],
  template: `
    <div style="max-width:760px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid var(--border);">
        <div>
          <h1 style="font-size:22px;font-weight:800;color:var(--text-primary);margin:0 0 4px;letter-spacing:-.3px;">My Vehicles</h1>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">
            {{ vehicles().length }} vehicle{{ vehicles().length !== 1 ? 's' : '' }} registered
          </p>
        </div>
        <button (click)="openAdd()"
                style="display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:700;letter-spacing:.02em;transition:opacity 150ms;"
                onmouseenter="this.style.opacity='.88'" onmouseleave="this.style.opacity='1'">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Add Vehicle
        </button>
      </div>

      <!-- Error banner -->
      @if (errorMsg()) {
        <div style="margin-bottom:20px;padding:12px 16px;border-radius:10px;background:rgba(244,33,46,.08);border:1px solid rgba(244,33,46,.2);" @fadeIn>
          <p style="font-size:13px;color:#f4212e;margin:0;">{{ errorMsg() }}</p>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">
          @for (i of [1,2,3]; track i) {
            <div style="height:140px;border-radius:16px;background:var(--bg-secondary);animation:pulse 1.5s infinite;"></div>
          }
        </div>
      }

      <!-- Empty state -->
      @else if (vehicles().length === 0) {
        <div style="padding:64px 24px;text-align:center;border-radius:16px;background:var(--bg-secondary);border:1px solid var(--border);" @slideUp>
          <div style="width:56px;height:56px;margin:0 auto 16px;border-radius:14px;background:var(--bg-hover);display:flex;align-items:center;justify-content:center;">
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 17a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2zm-9-4h10l1-4H6l1 4zM4 9l1-3h14l1 3"/>
            </svg>
          </div>
          <p style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0 0 6px;">No vehicles yet</p>
          <p style="font-size:13px;color:var(--text-secondary);margin:0 0 20px;">Add your vehicles to speed up the booking process.</p>
          <button (click)="openAdd()"
                  style="padding:10px 20px;border-radius:10px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:700;">
            Add your first vehicle
          </button>
        </div>
      }

      <!-- Vehicle grid -->
      @else {
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">
          @for (v of vehicles(); track v.id) {
            <div style="border-radius:16px;background:var(--bg-secondary);border:1px solid var(--border);padding:20px;display:flex;flex-direction:column;gap:16px;transition:border-color 150ms;"
                 onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'"
                 @slideUp>

              <!-- Top row: icon + plate + EV badge -->
              <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:44px;height:44px;border-radius:12px;background:var(--bg-hover);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="1.6">
                    <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="vehicleIcon(v.vehicleType)"/>
                  </svg>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:16px;font-weight:800;color:var(--text-primary);font-family:monospace;letter-spacing:.04em;">{{ v.plate }}</span>
                    @if (v.ev) {
                      <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;background:rgba(0,186,124,.1);color:#00ba7c;border:1px solid rgba(0,186,124,.2);letter-spacing:.04em;">EV</span>
                    }
                  </div>
                  <p style="font-size:12px;color:var(--text-secondary);margin:2px 0 0;">
                    {{ v.vehicleType | titlecase }}
                    @if (v.nickname) { · <em>{{ v.nickname }}</em> }
                  </p>
                </div>
              </div>

              <!-- Added date -->
              <div style="padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
                <span style="font-size:11px;color:var(--text-secondary);">
                  Added {{ formatDate(v.createdAt) }}
                </span>
                <div style="display:flex;gap:8px;">
                  <button (click)="openEdit(v)"
                          style="padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;transition:all 150ms;"
                          onmouseenter="this.style.color='var(--text-primary)';this.style.borderColor='var(--accent)'" onmouseleave="this.style.color='var(--text-secondary)';this.style.borderColor='var(--border)'">
                    Edit
                  </button>
                  <button (click)="confirmDelete(v)"
                          style="padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;background:transparent;border:1px solid transparent;color:var(--text-secondary);cursor:pointer;transition:all 150ms;"
                          onmouseenter="this.style.background='rgba(244,33,46,.08)';this.style.borderColor='rgba(244,33,46,.2)';this.style.color='#f4212e'" onmouseleave="this.style.background='transparent';this.style.borderColor='transparent';this.style.color='var(--text-secondary)'">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

    </div>

    <!-- Add / Edit modal -->
    @if (showForm()) {
      <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);"
           @fadeIn (click)="closeForm()">
        <div style="width:100%;max-width:440px;background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.5);overflow:hidden;"
             @scaleIn (click)="$event.stopPropagation()">

          <!-- Accent bar -->
          <div style="height:3px;background:linear-gradient(90deg,var(--accent),#7c3aed);"></div>

          <div style="padding:24px;">
            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
              <h3 style="font-size:17px;font-weight:800;color:var(--text-primary);margin:0;">{{ editingId() ? 'Edit Vehicle' : 'Add Vehicle' }}</h3>
              <button (click)="closeForm()" style="width:30px;height:30px;border-radius:8px;background:var(--bg-hover);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Plate -->
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;">Number Plate</label>
              <input [(ngModel)]="form.plate" type="text" placeholder="e.g. MH12AB1234"
                     [disabled]="!!editingId()"
                     style="width:100%;padding:10px 14px;border-radius:10px;font-size:14px;font-weight:700;font-family:monospace;letter-spacing:.06em;text-transform:uppercase;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;box-sizing:border-box;"
                     [style.opacity]="editingId() ? '.5' : '1'"
                     onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
            </div>

            <!-- Nickname -->
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;">Nickname <span style="font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>
              <input [(ngModel)]="form.nickname" type="text" placeholder="e.g. Daily Driver"
                     style="width:100%;padding:10px 14px;border-radius:10px;font-size:13px;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;box-sizing:border-box;"
                     onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
            </div>

            <!-- Vehicle type -->
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;">Type</label>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
                @for (t of vehicleTypes; track t.value) {
                  <button (click)="form.vehicleType = t.value"
                          style="padding:10px 8px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;outline:none;transition:all 150ms;text-align:center;"
                          [style.background]="form.vehicleType === t.value ? 'var(--accent-dim)' : 'var(--bg-secondary)'"
                          [style.border]="'1px solid ' + (form.vehicleType === t.value ? 'var(--accent)' : 'var(--border)')"
                          [style.color]="form.vehicleType === t.value ? 'var(--accent)' : 'var(--text-secondary)'">
                    {{ t.label }}
                  </button>
                }
              </div>
            </div>

            <!-- EV toggle -->
            <div style="margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:10px;background:var(--bg-secondary);border:1px solid var(--border);">
              <div>
                <p style="font-size:13px;font-weight:600;color:var(--text-primary);margin:0 0 2px;">Electric Vehicle</p>
                <p style="font-size:12px;color:var(--text-secondary);margin:0;">Eligible for EV-only spots</p>
              </div>
              <button (click)="form.ev = !form.ev"
                      style="width:44px;height:24px;border-radius:99px;border:none;cursor:pointer;transition:background 200ms;position:relative;flex-shrink:0;"
                      [style.background]="form.ev ? 'var(--accent)' : 'var(--border)'">
                <span style="position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left 200ms;"
                      [style.left]="form.ev ? '22px' : '2px'"></span>
              </button>
            </div>

            <!-- Form error -->
            @if (formError()) {
              <div style="margin-bottom:14px;padding:10px 14px;border-radius:10px;background:rgba(244,33,46,.08);border:1px solid rgba(244,33,46,.2);">
                <p style="font-size:13px;color:#f4212e;margin:0;">{{ formError() }}</p>
              </div>
            }

            <!-- Actions -->
            <div style="display:flex;gap:10px;">
              <button (click)="closeForm()"
                      style="flex:1;padding:11px;border-radius:10px;font-size:13px;font-weight:600;background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;">
                Cancel
              </button>
              <button (click)="saveVehicle()" [disabled]="saving()"
                      style="flex:2;padding:11px;border-radius:10px;font-size:13px;font-weight:700;background:var(--accent);color:#fff;border:none;cursor:pointer;transition:opacity 150ms;"
                      [style.opacity]="saving() ? '.65' : '1'">
                {{ saving() ? 'Saving…' : (editingId() ? 'Save Changes' : 'Add Vehicle') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirm modal -->
    @if (deletingVehicle()) {
      <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);"
           @fadeIn (click)="cancelDelete()">
        <div style="width:100%;max-width:360px;background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;padding:24px;box-shadow:0 24px 60px rgba(0,0,0,.5);"
             @scaleIn (click)="$event.stopPropagation()">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(244,33,46,.1);border:1px solid rgba(244,33,46,.2);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f4212e" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
            </svg>
          </div>
          <h3 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:0 0 6px;">Remove vehicle?</h3>
          <p style="font-size:13px;color:var(--text-secondary);margin:0 0 20px;line-height:1.5;">
            <strong style="color:var(--text-primary);font-family:monospace;">{{ deletingVehicle()!.plate }}</strong> will be removed from your account.
          </p>
          <div style="display:flex;gap:10px;">
            <button (click)="cancelDelete()"
                    style="flex:1;padding:10px;border-radius:10px;font-size:13px;font-weight:600;background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;">
              Cancel
            </button>
            <button (click)="deleteVehicle()" [disabled]="deleting()"
                    style="flex:1;padding:10px;border-radius:10px;font-size:13px;font-weight:700;background:#f4212e;color:#fff;border:none;cursor:pointer;transition:opacity 150ms;"
                    [style.opacity]="deleting() ? '.65' : '1'">
              {{ deleting() ? 'Removing…' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class VehiclePanelComponent implements OnInit {
  private vehicleSvc = inject(VehicleService);

  vehicles        = signal<Vehicle[]>([]);
  loading         = signal(true);
  errorMsg        = signal('');
  showForm        = signal(false);
  editingId       = signal<number | null>(null);
  saving          = signal(false);
  formError       = signal('');
  deletingVehicle = signal<Vehicle | null>(null);
  deleting        = signal(false);

  form = {
    plate: '',
    nickname: '',
    vehicleType: 'SEDAN' as VehicleType,
    ev: false,
  };

  vehicleTypes = VEHICLE_TYPES;
  vehicleIcon  = vehicleIcon;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.vehicleSvc.getMyVehicles().subscribe({
      next: v => { this.vehicles.set(v); this.loading.set(false); },
      error: () => { this.errorMsg.set('Failed to load vehicles.'); this.loading.set(false); }
    });
  }

  openAdd() {
    this.editingId.set(null);
    this.form = { plate: '', nickname: '', vehicleType: 'SEDAN', ev: false };
    this.formError.set('');
    this.showForm.set(true);
  }

  openEdit(v: Vehicle) {
    this.editingId.set(v.id);
    this.form = { plate: v.plate, nickname: v.nickname ?? '', vehicleType: v.vehicleType as VehicleType, ev: v.ev };
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  saveVehicle() {
    const plate = this.form.plate.trim().toUpperCase();
    if (!plate) { this.formError.set('Number plate is required.'); return; }
    if (plate.length < 4) { this.formError.set('Enter a valid number plate.'); return; }

    this.saving.set(true);
    this.formError.set('');

    const req: AddVehicleRequest = {
      plate,
      vehicleType: this.form.vehicleType,
      ev: this.form.ev,
      nickname: this.form.nickname.trim() || undefined,
    };

    const id = this.editingId();
    const call$ = id
      ? this.vehicleSvc.updateVehicle(id, req)
      : this.vehicleSvc.addVehicle(req);

    call$.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: err => {
        this.formError.set(err?.error?.message ?? 'Failed to save vehicle.');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(v: Vehicle) { this.deletingVehicle.set(v); }
  cancelDelete()             { this.deletingVehicle.set(null); }

  deleteVehicle() {
    const v = this.deletingVehicle();
    if (!v) return;
    this.deleting.set(true);
    this.vehicleSvc.deleteVehicle(v.id).subscribe({
      next: () => { this.deleting.set(false); this.deletingVehicle.set(null); this.load(); },
      error: () => { this.deleting.set(false); this.deletingVehicle.set(null); }
    });
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
