import { Component, OnDestroy, effect, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingSpot, SpotType, Vehicle, Booking } from '../../../core/models/parking.models';

@Component({
  selector: 'app-driver-spot-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    <div class="flex flex-wrap gap-2">
      <select [(ngModel)]="floorFilter" (ngModelChange)="applyFilter()"
              class="px-3 py-2 rounded-xl text-sm"
              style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);outline:none;">
        <option value="">All Floors</option>
        @for (f of floors(); track f) { <option [value]="f">Floor {{ f }}</option> }
      </select>
      <select [(ngModel)]="typeFilter" (ngModelChange)="applyFilter()"
              class="px-3 py-2 rounded-xl text-sm"
              style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);outline:none;">
        <option value="">All Types</option>
        @for (t of spotTypes; track t) { <option [value]="t">{{ t }}</option> }
      </select>
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
           style="background:rgba(0,0,0,.6);backdrop-filter:blur(4px);" @fadeIn
           (click)="closeBooking()">
        <div class="card p-6 w-full relative" style="max-width:440px;" (click)="$event.stopPropagation()" @scaleIn>
          <button (click)="closeBooking()"
                  style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:20px;line-height:1;">✕</button>

          <h3 style="font-size:18px;font-weight:800;color:var(--text-primary);margin:0 0 4px;">Book Spot {{ bookingSpot()!.spotNumber }}</h3>
          <p style="font-size:13px;color:var(--text-secondary);margin:0 0 20px;">
            Floor {{ bookingSpot()!.floor }} · {{ bookingSpot()!.spotType }} · ₹{{ bookingSpot()!.pricePerHour }}/hr
          </p>

          <div class="grid grid-cols-2 gap-2 mb-4">
            <button (click)="bookingType = 'WALK_IN'"
                    class="py-2.5 rounded-xl text-sm font-semibold transition-all"
                    [style.background]="bookingType === 'WALK_IN' ? 'var(--accent-dim)' : 'var(--bg-hover)'"
                    [style.border]="'1px solid ' + (bookingType === 'WALK_IN' ? 'var(--accent)' : 'var(--border)')"
                    [style.color]="bookingType === 'WALK_IN' ? 'var(--accent)' : 'var(--text-secondary)'"
                    style="cursor:pointer;outline:none;">Walk-In</button>
            <button (click)="bookingType = 'PRE_BOOKING'"
                    class="py-2.5 rounded-xl text-sm font-semibold transition-all"
                    [style.background]="bookingType === 'PRE_BOOKING' ? 'var(--accent-dim)' : 'var(--bg-hover)'"
                    [style.border]="'1px solid ' + (bookingType === 'PRE_BOOKING' ? 'var(--accent)' : 'var(--border)')"
                    [style.color]="bookingType === 'PRE_BOOKING' ? 'var(--accent)' : 'var(--text-secondary)'"
                    style="cursor:pointer;outline:none;">Pre-Book</button>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;">Start Time</p>
              <input [(ngModel)]="bookStart" type="datetime-local"
                     class="w-full px-3 py-2.5 rounded-xl text-sm"
                     style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;"/>
            </div>
            <div>
              <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;">End Time</p>
              <input [(ngModel)]="bookEnd" type="datetime-local"
                     class="w-full px-3 py-2.5 rounded-xl text-sm"
                     style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;"/>
            </div>
          </div>

          <div class="mb-4">
            <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;">Vehicle Plate</p>
            @if (vehicles().length > 0) {
              <select [(ngModel)]="bookPlate"
                      class="w-full px-3 py-2.5 rounded-xl text-sm"
                      style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;">
                @for (v of vehicles(); track v.id) {
                  <option [value]="v.plate">{{ v.plate }} ({{ v.vehicleType }})</option>
                }
                <option value="__manual__">Enter manually…</option>
              </select>
              @if (bookPlate === '__manual__') {
                <input [(ngModel)]="bookPlateManual" type="text" placeholder="Enter plate"
                       class="w-full px-3 py-2.5 rounded-xl text-sm mt-2"
                       style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;text-transform:uppercase;"/>
              }
            } @else {
              <input [(ngModel)]="bookPlateManual" type="text" placeholder="e.g. MH12AB1234"
                     class="w-full px-3 py-2.5 rounded-xl text-sm"
                     style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;text-transform:uppercase;"/>
            }
          </div>

          @if (estimatedCost() > 0) {
            <div class="mb-4 px-4 py-3 rounded-xl flex items-center justify-between" @fadeIn
                 style="background:var(--accent-dim);border:1px solid rgba(29,155,240,.2);">
              <span style="font-size:13px;color:var(--text-secondary);">Estimated cost</span>
              <span style="font-size:16px;font-weight:800;color:var(--accent);">₹{{ estimatedCost() }}</span>
            </div>
          }

          @if (bookingError()) {
            <p class="mb-3" style="font-size:13px;color:#f4212e;" @fadeIn>{{ bookingError() }}</p>
          }

          <button (click)="confirmBooking()" [disabled]="bookingLoading()"
                  class="w-full btn-accent py-3"
                  [style.opacity]="bookingLoading() ? '.6' : '1'">
            {{ bookingLoading() ? 'Confirming…' : 'Confirm & Pay' }}
          </button>
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

  estimatedCost = computed(() => {
    if (!this.bookStart || !this.bookEnd || !this.bookingSpot()) return 0;
    const ms = new Date(this.bookEnd).getTime() - new Date(this.bookStart).getTime();
    if (ms <= 0) return 0;
    return Math.ceil((ms / 3_600_000) * this.bookingSpot()!.pricePerHour);
  });

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
