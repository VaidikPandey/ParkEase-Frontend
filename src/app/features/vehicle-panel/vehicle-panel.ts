import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ParkingService } from '../../core/services/parking.service';
import { BookingService, CreateBookingRequest } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { ParkingSpot } from '../../core/models/parking.models';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-vehicle-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease', style({ opacity: 0, transform: 'translateY(-8px)' }))
      ])
    ]),
    trigger('successAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(.5)' }),
        animate('500ms cubic-bezier(.34,1.56,.64,1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  template: `
    <div class="p-6 max-w-2xl mx-auto page-host" @fadeSlideUp>
      <h2 style="font-size:22px; font-weight:700; color:var(--text-primary); margin:0 0 4px;">Vehicle Entry / Exit</h2>
      <p style="color:var(--text-secondary); font-size:14px; margin:0 0 24px;">Assign a parking slot to a vehicle</p>

      <!-- Success State -->
      @if (formState() === 'success') {
        <div class="card p-8 flex flex-col items-center text-center" @successAnim>
          <div class="w-20 h-20 rounded-full flex items-center justify-center mb-4"
               style="background:rgba(16,185,129,.1);">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#10b981" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
            </svg>
          </div>
          <h3 style="font-size:18px; font-weight:700; color:var(--text-primary); margin:0 0 8px;">Booking Confirmed!</h3>
          <p style="color:var(--text-secondary); font-size:14px; margin:0 0 4px;">
            Vehicle <strong>{{ plateDisplay }}</strong> assigned to slot
            <strong style="color:#6366f1;">{{ assignedSlot()?.spotNumber }}</strong>
          </p>
          <p style="color:var(--text-secondary); font-size:13px; margin:0 0 24px;">Floor {{ assignedSlot()?.floor }}</p>
          <button (click)="resetForm()"
                  class="px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style="background:#6366f1; color:white; border:none; cursor:pointer; transition:background 200ms ease;"
                  onmouseenter="this.style.background='#4f46e5'"
                  onmouseleave="this.style.background='#6366f1'">
            New Entry
          </button>
        </div>
      }

      <!-- Form -->
      @if (formState() !== 'success') {
        <div class="card p-6 space-y-5" @fadeSlideUp>

          <!-- Plate input with floating label -->
          <div class="floating-label-group">
            <input [(ngModel)]="plate" id="plate" placeholder=" "
                   (ngModelChange)="onPlateChange()"
                   class="w-full px-3 pt-5 pb-2 rounded-xl text-sm"
                   style="background:var(--bg-secondary); border:1.5px solid var(--border); color:var(--text-primary);
                          outline:none; transition:border-color 220ms ease;"
                   onfocus="this.style.borderColor='#6366f1'"
                   onblur="this.style.borderColor='var(--border)'"
                   maxlength="15" [disabled]="formState() === 'submitting'" />
            <label for="plate" style="font-size:13px;">Vehicle Number Plate</label>
          </div>

          <!-- Vehicle type -->
          <div>
            <p style="font-size:12px; font-weight:500; color:var(--text-secondary); margin:0 0 8px; text-transform:uppercase; letter-spacing:.05em;">Vehicle Type</p>
            <div class="grid gap-2" style="grid-template-columns: repeat(3, 1fr);">
              @for (type of vehicleTypes; track type.value) {
                <button (click)="vehicleType = type.value"
                        [disabled]="formState() === 'submitting'"
                        class="py-2.5 px-3 rounded-xl text-sm font-medium flex items-center gap-2 justify-center"
                        style="border:1.5px solid; transition:all 200ms ease; cursor:pointer;"
                        [style.border-color]="vehicleType === type.value ? '#6366f1' : 'var(--border)'"
                        [style.background]="vehicleType === type.value ? 'rgba(99,102,241,.1)' : 'var(--bg-secondary)'"
                        [style.color]="vehicleType === type.value ? '#6366f1' : 'var(--text-secondary)'">
                  <span>{{ type.icon }}</span>{{ type.label }}
                </button>
              }
            </div>
          </div>

          <!-- Duration -->
          <div>
            <p style="font-size:12px; font-weight:500; color:var(--text-secondary); margin:0 0 8px; text-transform:uppercase; letter-spacing:.05em;">Duration (hours)</p>
            <div class="flex gap-2">
              @for (h of [1,2,3,4,6,8]; track h) {
                <button (click)="hours = h"
                        [disabled]="formState() === 'submitting'"
                        class="px-3 py-2 rounded-xl text-sm font-medium"
                        style="border:1.5px solid; transition:all 200ms ease; cursor:pointer; flex:1;"
                        [style.border-color]="hours === h ? '#6366f1' : 'var(--border)'"
                        [style.background]="hours === h ? 'rgba(99,102,241,.1)' : 'var(--bg-secondary)'"
                        [style.color]="hours === h ? '#6366f1' : 'var(--text-secondary)'">
                  {{ h }}h
                </button>
              }
            </div>
          </div>

          <!-- Available slot preview -->
          @if (availableSpot()) {
            <div class="flex items-center gap-3 px-4 py-3 rounded-xl" @fadeSlideUp
                 style="background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.2);">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                   style="background:rgba(16,185,129,.15); color:#10b981;">
                {{ availableSpot()!.spotNumber }}
              </div>
              <div>
                <p style="font-size:13px; font-weight:600; color:#10b981; margin:0;">Slot Assigned</p>
                <p style="font-size:12px; color:var(--text-secondary); margin:0;">
                  Floor {{ availableSpot()!.floor }} · {{ availableSpot()!.spotType }} · ₹{{ availableSpot()!.pricePerHour }}/hr
                </p>
              </div>
            </div>
          }

          <!-- Error -->
          @if (formState() === 'error') {
            <div class="px-4 py-3 rounded-xl" @fadeSlideUp
                 style="background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); color:#ef4444; font-size:13px;">
              {{ errorMsg() }}
            </div>
          }

          <!-- Submit -->
          <button (click)="submit()"
                  [disabled]="!canSubmit() || formState() === 'submitting'"
                  class="w-full py-3 rounded-xl font-semibold text-sm"
                  style="transition:all 200ms ease; border:none;"
                  [style.background]="canSubmit() && formState() !== 'submitting' ? '#6366f1' : 'var(--border)'"
                  [style.color]="canSubmit() && formState() !== 'submitting' ? 'white' : 'var(--text-secondary)'"
                  [style.cursor]="canSubmit() ? 'pointer' : 'not-allowed'"
                  onmouseenter="if(!this.disabled) this.style.background='#4f46e5'"
                  onmouseleave="if(!this.disabled) this.style.background='#6366f1'">
            @if (formState() === 'submitting') {
              <span>Booking...</span>
            } @else {
              <span>Confirm Entry</span>
            }
          </button>
        </div>
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

  formState    = signal<FormState>('idle');
  errorMsg     = signal('');
  availableSpot = signal<ParkingSpot | null>(null);
  assignedSlot  = signal<ParkingSpot | null>(null);

  private availableSpots: ParkingSpot[] = [];

  vehicleTypes = [
    { value: 'SEDAN',      label: 'Sedan',    icon: '🚗' },
    { value: 'SUV',        label: 'SUV',      icon: '🚙' },
    { value: 'MOTORCYCLE', label: 'Moto',     icon: '🏍️' },
    { value: 'TRUCK',      label: 'Truck',    icon: '🚛' },
    { value: 'EV',         label: 'EV',       icon: '⚡' },
    { value: 'OTHER',      label: 'Other',    icon: '🚐' },
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
    return this.plate.trim().length >= 4 && !!this.availableSpot() && this.vehicleType;
  }

  submit() {
    if (!this.canSubmit()) return;
    const spot = this.availableSpot()!;
    const user = this.auth.currentUser();
    const now  = new Date();
    const end  = new Date(now.getTime() + this.hours * 3600_000);

    const fmt = (d: Date) => d.toISOString().slice(0, 19);

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
    this.plate        = '';
    this.vehicleType  = 'SEDAN';
    this.hours        = 2;
    this.formState.set('idle');
    this.errorMsg.set('');
    this.availableSpot.set(this.availableSpots[0] ?? null);
    this.parking.getAvailableSpots(this.parking.selectedLotId()).subscribe({
      next: s => { this.availableSpots = s; this.availableSpot.set(s[0] ?? null); }
    });
  }
}
