import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParkingService } from '../../core/services/parking.service';
import { BookingService, CreateBookingRequest } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { ParkingSpot } from '../../core/models/parking.models';
import { PremiumCardComponent } from '../../shared/components/premium-card/premium-card';
import { PremiumButtonComponent } from '../../shared/components/premium-button/premium-button';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-vehicle-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, PremiumCardComponent, PremiumButtonComponent],
  template: `
    <div class="max-w-[640px] mx-auto p-6 md:p-8 min-h-full pb-20 anim-in">

      <!-- Header -->
      <div class="flex items-end justify-between flex-wrap gap-6 mb-10 pb-6 border-b border-white/5 relative">
        <div class="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-accent/50 to-transparent"></div>
        <div class="relative z-10">
          <h1 class="text-[32px] md:text-[40px] font-extrabold text-text-primary m-0 tracking-tight leading-none drop-shadow-sm">Vehicle Entry</h1>
          <p class="text-[15px] text-text-secondary mt-2 font-medium tracking-wide">Assign a parking slot for walk-in vehicles</p>
        </div>
      </div>

      <!-- Success state -->
      @if (formState() === 'success') {
        <app-premium-card class="text-center anim-in">
          <div class="w-20 h-20 mx-auto rounded-full bg-success/10 text-success flex items-center justify-center mb-6 border border-success/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
            </svg>
          </div>
          <h3 class="text-2xl font-extrabold text-text-primary mb-2">Entry Confirmed!</h3>
          <p class="text-[16px] text-text-secondary mb-1">
            Vehicle <strong class="text-text-primary font-mono bg-bg-card px-2 py-0.5 rounded border border-white/5">{{ plateDisplay }}</strong> assigned to slot
            <strong class="text-accent text-[18px] ml-1">{{ assignedSlot()?.spotNumber }}</strong>
          </p>
          <p class="text-sm text-text-secondary mb-8 opacity-70">Floor {{ assignedSlot()?.floor }}</p>
          
          <app-premium-button variant="primary" size="lg" (onClick)="resetForm()">
            Log Another Vehicle
          </app-premium-button>
        </app-premium-card>
      }

      <!-- Form -->
      @if (formState() !== 'success') {
        <app-premium-card [hasHeader]="true" [noPadding]="true" class="anim-in anim-d1">
          
          <div card-header class="px-6 py-5 border-b border-white/5 bg-bg/40 flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-accent pulse-dot"></span>
            <span class="text-[16px] font-bold text-text-primary tracking-tight m-0">Walk-In Configuration</span>
          </div>

          <div class="p-6 md:p-8 flex flex-col gap-8">

            <!-- Plate input -->
            <div>
              <label class="block text-[11px] text-text-secondary font-black uppercase tracking-widest mb-3">Vehicle Number Plate</label>
              <div class="relative group">
                <input [(ngModel)]="plate" (ngModelChange)="onPlateChange()" maxlength="15"
                       [disabled]="formState() === 'submitting'" placeholder="e.g. MH01AB1234"
                       class="w-full bg-bg/50 border-2 border-white/5 rounded-2xl px-5 py-4 text-[18px] text-text-primary font-bold font-mono outline-none box-border uppercase tracking-widest transition-all duration-300 focus:border-accent focus:bg-accent/5 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] placeholder:text-text-secondary/30 placeholder:font-sans placeholder:tracking-normal placeholder:font-medium disabled:opacity-50"/>
                
                @if (plate.length >= 4) {
                  <div class="absolute right-4 top-1/2 -translate-y-1/2 text-success anim-in">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                  </div>
                }
              </div>
            </div>

            <!-- Vehicle type -->
            <div>
              <label class="block text-[11px] text-text-secondary font-black uppercase tracking-widest mb-3">Vehicle Type</label>
              <div class="grid grid-cols-3 gap-3">
                @for (type of vehicleTypes; track type.value) {
                  <button (click)="vehicleType = type.value" [disabled]="formState() === 'submitting'"
                          class="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl font-bold cursor-pointer transition-all duration-300 border-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                          [class.bg-accent/10]="vehicleType === type.value"
                          [class.border-accent]="vehicleType === type.value"
                          [class.text-accent]="vehicleType === type.value"
                          [class.shadow-[0_0_15px_rgba(34,211,238,0.2)]]="vehicleType === type.value"
                          [class.bg-white_5]="vehicleType !== type.value"
                          [class.border-transparent]="vehicleType !== type.value"
                          [class.text-text-secondary]="vehicleType !== type.value"
                          [class.hover:bg-white_10]="vehicleType !== type.value">
                    <span class="text-2xl drop-shadow-sm transition-transform duration-300" [class.scale-125]="vehicleType === type.value">{{ type.icon }}</span> 
                    <span class="text-[12px] uppercase tracking-wider">{{ type.label }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Duration -->
            <div>
              <label class="block text-[11px] text-text-secondary font-black uppercase tracking-widest mb-3">Estimated Duration</label>
              <div class="flex gap-2">
                @for (h of [1,2,3,4,6,8]; track h) {
                  <button (click)="hours = h" [disabled]="formState() === 'submitting'"
                          class="flex-1 py-3 rounded-xl font-black text-[14px] cursor-pointer transition-all duration-300 border-2 active:scale-90 disabled:opacity-50 disabled:active:scale-100"
                          [class.bg-accent/10]="hours === h"
                          [class.border-accent]="hours === h"
                          [class.text-accent]="hours === h"
                          [class.shadow-[0_0_15px_rgba(34,211,238,0.2)]]="hours === h"
                          [class.bg-white_5]="hours !== h"
                          [class.border-transparent]="hours !== h"
                          [class.text-text-secondary]="hours !== h"
                          [class.hover:bg-white_10]="hours !== h">
                    {{ h }}h
                  </button>
                }
              </div>
            </div>

            <!-- Available slot -->
            @if (availableSpot()) {
              <div class="flex items-center gap-4 p-4 rounded-2xl bg-success/5 border border-success/20 shadow-inner anim-in relative overflow-hidden">
                <div class="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-success/10 to-transparent pointer-events-none"></div>
                <div class="w-12 h-12 rounded-xl bg-success/20 text-success flex items-center justify-center text-[16px] font-black shrink-0 border border-success/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {{ availableSpot()!.spotNumber }}
                </div>
                <div class="relative z-10">
                  <p class="text-[14px] font-bold text-success m-0 mb-0.5 tracking-tight">Optimal Slot Found</p>
                  <p class="text-[12px] text-text-secondary font-medium m-0">
                    Floor {{ availableSpot()!.floor }} · {{ availableSpot()!.spotType }} · <span class="text-text-primary font-bold">₹{{ availableSpot()!.pricePerHour }}/hr</span>
                  </p>
                </div>
              </div>
            } @else if (plate.length >= 4) {
              <div class="p-4 rounded-2xl bg-warning/5 border border-warning/20 text-warning text-[13px] font-bold flex items-center gap-3">
                <span class="text-xl">⚠️</span> No available spots match this configuration.
              </div>
            }

            <!-- Error -->
            @if (formState() === 'error') {
              <div class="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-[13px] font-bold flex items-center gap-3 anim-in">
                <span class="text-xl">🛑</span> {{ errorMsg() }}
              </div>
            }

            <!-- Submit -->
            <div class="mt-4">
              <app-premium-button 
                  [variant]="canSubmit() ? 'primary' : 'secondary'" 
                  size="lg" 
                  [fullWidth]="true"
                  [disabled]="!canSubmit()"
                  [loading]="formState() === 'submitting'"
                  (onClick)="submit()">
                {{ formState() === 'submitting' ? 'Confirming Entry...' : 'Authorize Entry' }}
              </app-premium-button>
            </div>

          </div>
        </app-premium-card>
      }
    </div>
  `
})
export class VehiclePanelComponent implements OnInit {
  private parking = inject(ParkingService);
  private booking = inject(BookingService);
  private auth    = inject(AuthService);

  plate        = '';
  vehicleType  = 'SEDAN';
  hours        = 2;
  plateDisplay = '';

  formState     = signal<FormState>('idle');
  errorMsg      = signal('');
  availableSpot = signal<ParkingSpot | null>(null);
  assignedSlot  = signal<ParkingSpot | null>(null);

  private availableSpots: ParkingSpot[] = [];

  vehicleTypes = [
    { value: 'SEDAN',      label: 'Sedan',  icon: '🚗' },
    { value: 'SUV',        label: 'SUV',    icon: '🚙' },
    { value: 'MOTORCYCLE', label: 'Moto',   icon: '🏍️' },
    { value: 'TRUCK',      label: 'Truck',  icon: '🚛' },
    { value: 'EV',         label: 'EV',     icon: '⚡' },
    { value: 'OTHER',      label: 'Other',  icon: '🚐' },
  ];

  ngOnInit() {
    this.parking.getAvailableSpots(this.parking.selectedLotId()).subscribe({
      next: spots => {
        this.availableSpots = spots;
        if (spots.length) this.availableSpot.set(spots[0]);
      }
    });
  }

  onPlateChange() {
    this.plate = this.plate.toUpperCase();
    if (this.availableSpots.length) this.availableSpot.set(this.availableSpots[0]);
  }

  canSubmit() {
    return this.plate.trim().length >= 4 && !!this.availableSpot() && !!this.vehicleType;
  }

  submit() {
    if (!this.canSubmit()) return;
    const spot = this.availableSpot()!;
    const user = this.auth.currentUser();
    const now  = new Date();
    const end  = new Date(now.getTime() + this.hours * 3600_000);
    const fmt  = (d: Date) => d.toISOString().slice(0, 19);

    const req: CreateBookingRequest = {
      spotId:       spot.spotId,
      lotId:        spot.lotId,
      spotNumber:   spot.spotNumber,
      bookingType:  'WALK_IN',
      startTime:    fmt(now),
      endTime:      fmt(end),
      pricePerHour: spot.pricePerHour,
      vehiclePlate: this.plate.trim(),
      driverEmail:  user?.email ?? '',
    };

    this.formState.set('submitting');
    this.booking.createBooking(req).subscribe({
      next: () => {
        this.plateDisplay = this.plate;
        this.assignedSlot.set(spot);
        this.formState.set('success');
      },
      error: err => {
        this.errorMsg.set(err?.error?.message ?? 'Booking failed. Please try again.');
        this.formState.set('error');
      }
    });
  }

  resetForm() {
    this.plate       = '';
    this.vehicleType = 'SEDAN';
    this.hours       = 2;
    this.formState.set('idle');
    this.errorMsg.set('');
    this.availableSpot.set(this.availableSpots[0] ?? null);
    this.parking.getAvailableSpots(this.parking.selectedLotId()).subscribe({
      next: s => { this.availableSpots = s; this.availableSpot.set(s[0] ?? null); }
    });
  }
}
