import { Component, OnDestroy, effect, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingSpot, SpotType, Vehicle, Booking } from '../../../core/models/parking.models';
import { ThemeSelectComponent, ThemeSelectOption } from '../../../shared/components/theme-select/theme-select';

@Component({
  selector: 'app-driver-spot-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemeSelectComponent],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))])]),
    trigger('fadeUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(16px)' }), animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
    trigger('slotAnim', [
      transition('* => *', [
        query(':enter', [style({ opacity: 0, transform: 'scale(.9)' }), stagger(20, [animate('240ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'scale(1)' }))])], { optional: true })
      ])
    ]),
    trigger('scaleIn', [transition(':enter', [style({ opacity: 0, transform: 'scale(.88)' }), animate('320ms cubic-bezier(.34,1.56,.64,1)', style({ opacity: 1, transform: 'scale(1)' }))])]),
  ],
  template: `
    <!-- Filters row -->
    <div class="flex flex-wrap gap-2 items-end">
      <app-theme-select
        placeholder="All floors"
        width="160px"
        [options]="floorOptions()"
        [value]="floorFilter"
        clearLabel="All floors"
        (valueChange)="setFloorFilter($event)" />
      <app-theme-select
        placeholder="All types"
        width="180px"
        [options]="typeOptions"
        [value]="typeFilter"
        clearLabel="All types"
        (valueChange)="setTypeFilter($event)" />
      <div class="flex gap-3 ml-auto">
        @for (leg of legend; track leg.label) {
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full" [style.background]="leg.color"></div>
            <span style="font-size:12px;color:var(--text-secondary);">{{ leg.label }}</span>
          </div>
        }
      </div>
    </div>

    <!-- Spot grid -->
    @if (loadingSpots()) {
      <div class="grid gap-2" style="grid-template-columns:repeat(auto-fill,minmax(90px,1fr));">
        @for (i of [1,2,3,4,5,6,7,8]; track i) {
          <div class="rounded-2xl animate-pulse" style="height:90px;background:var(--bg-card);"></div>
        }
      </div>
    } @else {
      <div class="grid gap-2" [@slotAnim]="filtered().length"
           style="grid-template-columns:repeat(auto-fill,minmax(90px,1fr));">
        @for (spot of filtered(); track spot.spotId) {
          <button (click)="spot.status === 'AVAILABLE' ? openBooking(spot) : null"
                  class="flex flex-col items-center justify-center rounded-2xl border-2 select-none"
                  style="height:90px;transition:transform 180ms ease,box-shadow 180ms ease;"
                  [class.slot-available]="spot.status === 'AVAILABLE'"
                  [class.slot-reserved]="spot.status === 'RESERVED'"
                  [class.slot-occupied]="spot.status === 'OCCUPIED'"
                  [style.cursor]="spot.status === 'AVAILABLE' ? 'pointer' : 'default'"
                  [style.opacity]="spot.status !== 'AVAILABLE' ? '.55' : '1'"
                  onmouseenter="if(this.style.opacity!=='.55'){this.style.transform='scale(1.06)';this.style.boxShadow='0 6px 20px rgba(0,0,0,.15)'}"
                  onmouseleave="this.style.transform='scale(1)';this.style.boxShadow='none'">
            <span style="font-size:13px;font-weight:700;">{{ spot.spotNumber }}</span>
            <span style="font-size:10px;opacity:.75;margin-top:2px;">F{{ spot.floor }}</span>
            <span style="font-size:9px;opacity:.6;">{{ spot.spotType | slice:0:3 }}</span>
            <span style="font-size:9px;font-weight:600;margin-top:2px;">₹{{ spot.pricePerHour }}/h</span>
          </button>
        }
      </div>
      @if (!filtered().length) {
        <div class="card p-12 flex flex-col items-center text-center" @fadeUp>
          <p style="font-size:15px;color:var(--text-secondary);">No available spots match your filters.</p>
        </div>
      }
    }

    <!-- Booking modal -->
    @if (bookingSpot()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           style="background:rgba(0,0,0,.72);backdrop-filter:blur(6px);" @fadeIn
           (click)="closeBooking()">
        <div class="w-full relative" style="max-width:480px;background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;box-shadow:0 32px 80px rgba(0,0,0,.5);" (click)="$event.stopPropagation()" @scaleIn>

          <!-- Accent bar -->
          <div style="height:3px;border-radius:20px 20px 0 0;background:linear-gradient(90deg,var(--accent),#7c3aed);"></div>

          <div style="padding:24px;">
            <!-- Header -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;">
              <div>
                <h3 style="font-size:18px;font-weight:800;color:var(--text-primary);margin:0 0 4px;letter-spacing:-.2px;">
                  Spot {{ bookingSpot()!.spotNumber }}
                </h3>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <span style="font-size:12px;color:var(--text-secondary);">Floor {{ bookingSpot()!.floor }}</span>
                  <span style="color:var(--border);">·</span>
                  <span style="font-size:12px;color:var(--text-secondary);">{{ bookingSpot()!.spotType }}</span>
                  <span style="color:var(--border);">·</span>
                  <span style="font-size:12px;font-weight:700;color:var(--accent);">₹{{ bookingSpot()!.pricePerHour }}/hr</span>
                </div>
              </div>
              <button (click)="closeBooking()" style="background:var(--bg-hover);border:none;cursor:pointer;color:var(--text-secondary);width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Type toggle -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">
              <button (click)="bookingType = 'WALK_IN'"
                      style="padding:10px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;outline:none;transition:all 150ms;display:flex;align-items:center;justify-content:center;gap:6px;"
                      [style.background]="bookingType === 'WALK_IN' ? 'var(--accent-dim)' : 'var(--bg-secondary)'"
                      [style.border]="'1px solid ' + (bookingType === 'WALK_IN' ? 'var(--accent)' : 'var(--border)')"
                      [style.color]="bookingType === 'WALK_IN' ? 'var(--accent)' : 'var(--text-secondary)'">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
                </svg>
                Walk-In
              </button>
              <button (click)="bookingType = 'PRE_BOOKING'"
                      style="padding:10px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;outline:none;transition:all 150ms;display:flex;align-items:center;justify-content:center;gap:6px;"
                      [style.background]="bookingType === 'PRE_BOOKING' ? 'var(--accent-dim)' : 'var(--bg-secondary)'"
                      [style.border]="'1px solid ' + (bookingType === 'PRE_BOOKING' ? 'var(--accent)' : 'var(--border)')"
                      [style.color]="bookingType === 'PRE_BOOKING' ? 'var(--accent)' : 'var(--text-secondary)'">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                </svg>
                Pre-Book
              </button>
            </div>

            <!-- Time pickers -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div>
                <p style="font-size:11px;font-weight:600;color:var(--text-secondary);margin:0 0 6px;text-transform:uppercase;letter-spacing:.06em;">From</p>
                <input [(ngModel)]="bookStart" type="datetime-local"
                       style="width:100%;padding:10px 12px;border-radius:10px;font-size:13px;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;box-sizing:border-box;"
                       onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
              </div>
              <div>
                <p style="font-size:11px;font-weight:600;color:var(--text-secondary);margin:0 0 6px;text-transform:uppercase;letter-spacing:.06em;">To</p>
                <input [(ngModel)]="bookEnd" type="datetime-local"
                       style="width:100%;padding:10px 12px;border-radius:10px;font-size:13px;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;box-sizing:border-box;"
                       onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
              </div>
            </div>

            <!-- Duration hint -->
            @if (durationHours() > 0) {
              <div style="margin-bottom:16px;padding:8px 12px;border-radius:10px;background:var(--bg-secondary);border:1px solid var(--border);display:flex;align-items:center;gap:8px;" @fadeIn>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span style="font-size:12px;color:var(--text-secondary);">Duration: <strong style="color:var(--text-primary);">{{ durationLabel() }}</strong></span>
              </div>
            }

            <!-- Vehicle plate -->
            <div style="margin-bottom:16px;">
                <p style="font-size:11px;font-weight:600;color:var(--text-secondary);margin:0 0 6px;text-transform:uppercase;letter-spacing:.06em;">Vehicle Plate</p>
              @if (vehicles().length > 0) {
                <app-theme-select
                  placeholder="Select vehicle"
                  width="100%"
                  [options]="vehicleOptions()"
                  [value]="bookPlate"
                  [allowClear]="false"
                  (valueChange)="bookPlate = $event" />
                @if (bookPlate === '__manual__') {
                  <input [(ngModel)]="bookPlateManual" type="text" placeholder="e.g. MH12AB1234"
                         style="width:100%;padding:10px 12px;border-radius:10px;font-size:13px;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;box-sizing:border-box;margin-top:8px;text-transform:uppercase;"
                         onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
                }
              } @else {
                <input [(ngModel)]="bookPlateManual" type="text" placeholder="e.g. MH12AB1234"
                       style="width:100%;padding:10px 12px;border-radius:10px;font-size:13px;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;box-sizing:border-box;text-transform:uppercase;"
                       onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
              }
            </div>

            <!-- Cost estimate -->
            @if (estimatedCost() > 0) {
              <div style="margin-bottom:16px;padding:14px 16px;border-radius:12px;background:linear-gradient(135deg,var(--accent-dim),rgba(124,58,237,.06));border:1px solid rgba(29,155,240,.2);display:flex;align-items:center;justify-content:space-between;" @fadeIn>
                <div>
                  <p style="font-size:11px;color:var(--text-secondary);margin:0 0 2px;text-transform:uppercase;letter-spacing:.06em;">Estimated Total</p>
                  <p style="font-size:11px;color:var(--text-secondary);margin:0;">Actual fare charged on checkout</p>
                </div>
                <span style="font-size:22px;font-weight:900;color:var(--accent);letter-spacing:-.5px;">₹{{ estimatedCost() }}</span>
              </div>
            }

            @if (bookingError()) {
              <div style="margin-bottom:12px;padding:10px 14px;border-radius:10px;background:rgba(244,33,46,.08);border:1px solid rgba(244,33,46,.2);" @fadeIn>
                <p style="font-size:13px;color:#f4212e;margin:0;">{{ bookingError() }}</p>
              </div>
            }

            <button (click)="confirmBooking()" [disabled]="bookingLoading()"
                    style="width:100%;padding:13px;border-radius:12px;font-size:14px;font-weight:700;background:var(--accent);color:#fff;border:none;cursor:pointer;transition:opacity 150ms;letter-spacing:.02em;"
                    [style.opacity]="bookingLoading() ? '.6' : '1'">
              {{ bookingLoading() ? 'Reserving spot…' : 'Reserve & Pay — ₹' + (estimatedCost() || bookingSpot()!.pricePerHour) }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class DriverSpotGridComponent implements OnDestroy {
  lotId    = input.required<number>();
  vehicles = input<Vehicle[]>([]);
  bookingConfirmed = output<{ booking: Booking; cost: number }>();

  private parking    = inject(ParkingService);
  private bookingSvc = inject(BookingService);
  private auth       = inject(AuthService);
  private destroy$   = new Subject<void>();

  allSpots     = signal<ParkingSpot[]>([]);
  filtered     = signal<ParkingSpot[]>([]);
  floors       = signal<number[]>([]);
  loadingSpots = signal(true);

  floorFilter = '';
  typeFilter  = '';
  spotTypes: SpotType[] = ['STANDARD', 'COMPACT', 'LARGE', 'EV_ONLY', 'HANDICAPPED'];
  typeOptions: ThemeSelectOption[] = this.spotTypes.map(type => ({ label: type.replaceAll('_', ' '), value: type }));
  legend = [
    { label: 'Available', color: '#00ba7c' },
    { label: 'Reserved',  color: '#ffd400' },
    { label: 'Occupied',  color: '#f4212e' },
  ];

  bookingSpot    = signal<ParkingSpot | null>(null);
  bookingType: 'WALK_IN' | 'PRE_BOOKING' = 'WALK_IN';
  bookStart      = '';
  bookEnd        = '';
  bookPlate      = '';
  bookPlateManual = '';
  bookingLoading = signal(false);
  bookingError   = signal('');

  durationHours = computed(() => {
    if (!this.bookStart || !this.bookEnd) return 0;
    const ms = new Date(this.bookEnd).getTime() - new Date(this.bookStart).getTime();
    return ms > 0 ? ms / 3_600_000 : 0;
  });

  durationLabel = computed(() => {
    const h = this.durationHours();
    if (h <= 0) return '';
    const hrs  = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  });

  estimatedCost = computed(() => {
    const h = this.durationHours();
    if (h <= 0 || !this.bookingSpot()) return 0;
    return Math.ceil(h * this.bookingSpot()!.pricePerHour);
  });
  floorOptions = computed<ThemeSelectOption[]>(() => this.floors().map(floor => ({ label: `Floor ${floor}`, value: String(floor) })));
  vehicleOptions = computed<ThemeSelectOption[]>(() => [
    ...this.vehicles().map(vehicle => ({ label: vehicle.plate, value: vehicle.plate, meta: vehicle.vehicleType })),
    { label: 'Enter manually', value: '__manual__', meta: 'Use another vehicle plate' },
  ]);

  constructor() {
    effect(() => {
      const id = this.lotId();
      if (id) this.loadSpots(id);
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  loadSpots(lotId: number) {
    this.loadingSpots.set(true);
    this.floorFilter = '';
    this.typeFilter  = '';
    this.parking.getAvailableSpots(lotId).pipe(takeUntil(this.destroy$)).subscribe({
      next: spots => {
        this.allSpots.set(spots);
        this.floors.set([...new Set(spots.map(s => s.floor))].sort());
        this.applyFilter();
        this.loadingSpots.set(false);
      },
      error: () => this.loadingSpots.set(false)
    });
  }

  applyFilter() {
    let r = this.allSpots();
    if (this.floorFilter) r = r.filter(s => s.floor === +this.floorFilter);
    if (this.typeFilter)  r = r.filter(s => s.spotType === this.typeFilter);
    this.filtered.set(r);
  }

  setFloorFilter(value: string) {
    this.floorFilter = value;
    this.applyFilter();
  }

  setTypeFilter(value: string) {
    this.typeFilter = value;
    this.applyFilter();
  }

  openBooking(spot: ParkingSpot) {
    this.bookingSpot.set(spot);
    this.bookingError.set('');
    const start = new Date(Date.now() + 2 * 60_000);
    const end   = new Date(start.getTime() + 2 * 3_600_000);
    this.bookStart = this.toLocalDT(start);
    this.bookEnd   = this.toLocalDT(end);
    this.bookPlate = this.vehicles().length ? this.vehicles()[0].plate : '';
    this.bookPlateManual = '';
  }

  closeBooking() { this.bookingSpot.set(null); }

  confirmBooking() {
    const spot = this.bookingSpot();
    if (!spot) return;
    const plate = (this.bookPlate === '__manual__' ? this.bookPlateManual : (this.bookPlate || this.bookPlateManual)).trim();
    if (!plate)                                            { this.bookingError.set('Please enter a vehicle plate.'); return; }
    if (!this.bookStart || !this.bookEnd)                  { this.bookingError.set('Please set start and end times.'); return; }
    if (new Date(this.bookEnd) <= new Date(this.bookStart)) { this.bookingError.set('End time must be after start time.'); return; }
    if (new Date(this.bookStart) <= new Date())             { this.bookingError.set('Start time must be in the future.'); return; }

    this.bookingLoading.set(true);
    this.bookingError.set('');
    const cost = this.estimatedCost();

    this.bookingSvc.createBooking({
      spotId:       spot.spotId,
      lotId:        spot.lotId,
      spotNumber:   spot.spotNumber,
      bookingType:  this.bookingType,
      startTime:    this.bookStart.length === 16 ? this.bookStart + ':00' : this.bookStart,
      endTime:      this.bookEnd.length   === 16 ? this.bookEnd   + ':00' : this.bookEnd,
      pricePerHour: spot.pricePerHour,
      vehiclePlate: plate.toUpperCase(),
      driverEmail:  this.auth.currentUser()?.email ?? '',
    }).subscribe({
      next: (booking: Booking) => {
        this.bookingLoading.set(false);
        this.bookingSpot.set(null);
        this.loadSpots(this.lotId());
        this.bookingConfirmed.emit({ booking, cost });
      },
      error: err => {
        this.bookingError.set(err?.error?.message ?? 'Booking failed. Please try again.');
        this.bookingLoading.set(false);
      }
    });
  }

  private toLocalDT(d: Date) {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }
}
