import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ParkingLot, Vehicle, Booking } from '../../../core/models/parking.models';
import { DriverBrowseComponent } from './driver-browse';
import { DriverNearbyComponent } from './driver-nearby';
import { DriverMyBookingsComponent } from './driver-my-bookings';
import { DriverPaymentModalComponent } from './driver-payment-modal';

@Component({
  selector: 'app-driver-slots',
  standalone: true,
  imports: [CommonModule, DriverBrowseComponent, DriverNearbyComponent, DriverMyBookingsComponent, DriverPaymentModalComponent],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))])]),
  ],
  template: `
    <div class="p-6 space-y-5 page-host" @fadeUp>

      <!-- Header + mode toggle -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 style="font-size:22px;font-weight:700;color:var(--text-primary);margin:0;">Find Parking</h2>
          <p style="color:var(--text-secondary);font-size:14px;margin:4px 0 0;">Browse available spots and book instantly</p>
        </div>
        <div class="flex rounded-xl p-1" style="background:var(--bg-hover);border:1px solid var(--border);">
          @for (tab of tabs; track tab.id) {
            <button (click)="driverMode.set(tab.id)"
                    class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
                    [style.background]="driverMode() === tab.id ? 'var(--bg-card)' : 'transparent'"
                    [style.color]="driverMode() === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)'"
                    style="border:none;cursor:pointer;">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="tab.icon"/>
              </svg>
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      @if (driverMode() === 'browse') {
        <app-driver-browse
          [allLots]="allLots()"
          [loadingLots]="loadingLots()"
          [vehicles]="myVehicles()"
          (bookingConfirmed)="onBookingConfirmed($event)"
          @fadeIn />
      }
      @if (driverMode() === 'nearby') {
        <app-driver-nearby
          [vehicles]="myVehicles()"
          (bookingConfirmed)="onBookingConfirmed($event)"
          @fadeIn />
      }
      @if (driverMode() === 'bookings') {
        <app-driver-my-bookings @fadeIn />
      }

      @if (paymentBooking()) {
        <app-driver-payment-modal
          [booking]="paymentBooking()!"
          [storedCost]="storedCost()"
          (closed)="clearPayment()"
          (done)="clearPayment()" />
      }

    </div>
  `
})
export class DriverSlotsComponent implements OnInit, OnDestroy {
  private parking    = inject(ParkingService);
  private vehicleSvc = inject(VehicleService);
  private destroy$   = new Subject<void>();

  driverMode     = signal<'browse' | 'nearby' | 'bookings'>('browse');
  allLots        = signal<ParkingLot[]>([]);
  loadingLots    = signal(true);
  myVehicles     = signal<Vehicle[]>([]);
  paymentBooking = signal<Booking | null>(null);
  storedCost     = signal(0);

  tabs = [
    { id: 'browse'   as const, label: 'Browse Lots',  icon: 'M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5' },
    { id: 'nearby'   as const, label: 'Near Me',      icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' },
    { id: 'bookings' as const, label: 'My Bookings',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  ];

  ngOnInit() {
    forkJoin({
      lots:     this.parking.getApprovedLots(),
      vehicles: this.vehicleSvc.getMyVehicles()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ lots, vehicles }) => {
        this.allLots.set(lots);
        this.myVehicles.set(vehicles);
        this.loadingLots.set(false);
      },
      error: () => this.loadingLots.set(false)
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  onBookingConfirmed(event: { booking: Booking; cost: number }) {
    this.storedCost.set(event.cost);
    this.paymentBooking.set(event.booking);
  }

  clearPayment() { this.paymentBooking.set(null); }
}
