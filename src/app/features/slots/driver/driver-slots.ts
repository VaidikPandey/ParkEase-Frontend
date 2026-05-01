import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { BookingService } from '../../../core/services/booking.service';
import { ParkingLot, Vehicle, Booking } from '../../../core/models/parking.models';
import { DriverBrowseComponent } from './driver-browse';
import { DriverNearbyComponent } from './driver-nearby';
import { DriverMyBookingsComponent } from './driver-my-bookings';
import { DriverPaymentModalComponent } from './driver-payment-modal';

@Component({
  selector: 'app-driver-slots',
  standalone: true,
  imports: [CommonModule, DriverBrowseComponent, DriverNearbyComponent, DriverMyBookingsComponent, DriverPaymentModalComponent],
  template: `
    <div style="max-width:1100px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header + tab toggle -->
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <h1 style="font-size:22px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.3px;">Find Parking</h1>
          <p style="font-size:13px;color:#71767b;margin:0;">Browse available spots and book instantly</p>
        </div>

        <!-- Segment tabs -->
        <div style="display:flex;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:4px;gap:4px;">
          @for (tab of tabs; track tab.id) {
            <button (click)="driverMode.set(tab.id)"
                    style="padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all 150ms ease;display:flex;align-items:center;gap:6px;"
                    [style.background]="driverMode() === tab.id ? 'rgba(255,255,255,.08)' : 'transparent'"
                    [style.color]="driverMode() === tab.id ? '#e7e9ea' : '#71767b'">
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
          (bookingConfirmed)="onBookingConfirmed($event)" />
      }
      @if (driverMode() === 'nearby') {
        <app-driver-nearby
          [vehicles]="myVehicles()"
          (bookingConfirmed)="onBookingConfirmed($event)" />
      }
      @if (driverMode() === 'bookings') {
        <app-driver-my-bookings />
      }

      @if (paymentBooking()) {
        <app-driver-payment-modal
          [booking]="paymentBooking()!"
          [storedCost]="storedCost()"
          (closed)="onPaymentClosed()"
          (done)="clearPayment()" />
      }
    </div>
  `
})
export class DriverSlotsComponent implements OnInit, OnDestroy {
  private parking    = inject(ParkingService);
  private vehicleSvc = inject(VehicleService);
  private bookingSvc = inject(BookingService);
  private destroy$   = new Subject<void>();

  driverMode     = signal<'browse' | 'nearby' | 'bookings'>('browse');
  allLots        = signal<ParkingLot[]>([]);
  loadingLots    = signal(true);
  myVehicles     = signal<Vehicle[]>([]);
  paymentBooking = signal<Booking | null>(null);
  storedCost     = signal(0);

  tabs = [
    { id: 'browse'   as const, label: 'Browse',    icon: 'M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5' },
    { id: 'nearby'   as const, label: 'Near Me',   icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' },
    { id: 'bookings' as const, label: 'My Bookings', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
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

  onPaymentClosed() {
    const booking = this.paymentBooking();
    if (booking) {
      this.bookingSvc.cancel(booking.bookingId, 'CHANGE_OF_PLANS')
        .pipe(takeUntil(this.destroy$))
        .subscribe({ error: () => {} });
    }
    this.paymentBooking.set(null);
  }
}
