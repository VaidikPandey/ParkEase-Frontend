import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingSpot, Booking } from '../../../core/models/parking.models';
import { StatCardSkeletonComponent } from '../../../shared/components/skeleton/skeleton';

const BOOKING_STATUS_COLOR: Record<string, string> = {
  CONFIRMED: '#1d9bf0', CHECKED_IN: '#00ba7c', CHECKED_OUT: '#71767b',
  CANCELLED: '#f4212e', EXPIRED: '#f4212e', PENDING: '#ffd400',
};

const ICONS = {
  bookings: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>`,
  wallet:   `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/></svg>`,
  active:   `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>`,
  wave:     `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712l.003-2.024a.668.668 0 01.198-.471 1.575 1.575 0 10-2.228-2.228 3.818 3.818 0 00-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0116.16 9.75"/></svg>`,
};

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardSkeletonComponent],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('stagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(70, animate('350ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
               style="background:rgba(29,155,240,.12);color:var(--accent);"
               [innerHTML]="safe(icons.wave)"></div>
          <h2 style="font-size:22px;font-weight:800;color:var(--text-primary);margin:0;letter-spacing:-.4px;">
            Hi, {{ firstName() }}
          </h2>
        </div>
        <p style="color:var(--text-secondary);font-size:13px;margin:0;">Here's your parking summary</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-xs font-bold"
              style="background:rgba(0,186,124,.1);color:#00ba7c;border:1px solid rgba(0,186,124,.2);">DRIVER</span>
        <a routerLink="/slots" class="btn-accent"
           style="font-size:13px;padding:7px 16px;border-radius:9999px;text-decoration:none;">Book a Spot</a>
      </div>
    </div>

    @if (activeBooking()) {
      <div class="card p-5" @fadeUp
           style="border-color:var(--accent);background:linear-gradient(135deg,var(--accent-dim) 0%,var(--bg-card) 100%);">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p style="font-size:12px;font-weight:600;color:var(--accent);margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em;">Active Booking</p>
            <p style="font-size:18px;font-weight:800;color:var(--text-primary);margin:0;">Slot {{ activeBooking()!.spotNumber }}</p>
            <p style="font-size:13px;color:var(--text-secondary);margin:4px 0 0;">
              {{ activeBooking()!.startTime | date:'MMM d, HH:mm' }} – {{ activeBooking()!.endTime | date:'HH:mm' }}
              · {{ activeBooking()!.vehiclePlate }}
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-sm font-bold"
                [style.background]="bookingColor(activeBooking()!.status) + '18'"
                [style.color]="bookingColor(activeBooking()!.status)">
            {{ activeBooking()!.status }}
          </span>
        </div>
        <div class="flex gap-2 mt-4">
          @if (activeBooking()!.status === 'CONFIRMED') {
            <button (click)="doCheckIn(activeBooking()!.bookingId)"
                    class="btn-accent" style="font-size:13px;padding:8px 20px;border-radius:9999px;">
              Check In
            </button>
            <button (click)="doCancel(activeBooking()!.bookingId)"
                    style="font-size:13px;padding:8px 20px;border-radius:9999px;background:rgba(244,33,46,.08);color:#f4212e;border:1px solid rgba(244,33,46,.2);cursor:pointer;">
              Cancel
            </button>
          }
          @if (activeBooking()!.status === 'CHECKED_IN') {
            <button (click)="doCheckOut(activeBooking()!.bookingId)"
                    style="font-size:13px;padding:8px 20px;border-radius:9999px;background:var(--text-primary);color:var(--bg-primary);border:none;cursor:pointer;font-weight:700;">
              Check Out
            </button>
          }
        </div>
      </div>
    }

    @if (loading()) {
      <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
        @for (i of [1,2,3]; track i) { <app-stat-card-skeleton /> }
      </div>
    } @else {
      <div class="grid gap-4" [@stagger]="3" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
        <div class="card p-5"
             style="transition:transform 200ms ease,box-shadow 200ms ease;"
             onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,.15)'"
             onmouseleave="this.style.transform='';this.style.boxShadow=''">
          <div class="flex items-center justify-between mb-4">
            <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);margin:0;">Total Bookings</p>
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:rgba(29,155,240,.12);color:#1d9bf0;" [innerHTML]="safe(icons.bookings)"></div>
          </div>
          <p style="font-size:34px;font-weight:800;letter-spacing:-1px;margin:0;color:var(--text-primary);">{{ myBookings().length }}</p>
          <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 0;">All time</p>
        </div>
        <div class="card p-5"
             style="transition:transform 200ms ease,box-shadow 200ms ease;"
             onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,.15)'"
             onmouseleave="this.style.transform='';this.style.boxShadow=''">
          <div class="flex items-center justify-between mb-4">
            <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);margin:0;">Active Now</p>
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:rgba(0,186,124,.12);color:#00ba7c;" [innerHTML]="safe(icons.active)"></div>
          </div>
          <p style="font-size:34px;font-weight:800;letter-spacing:-1px;margin:0;color:var(--accent);">{{ activeCount() }}</p>
          <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 0;">In progress</p>
        </div>
        <div class="card p-5"
             style="transition:transform 200ms ease,box-shadow 200ms ease;"
             onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,.15)'"
             onmouseleave="this.style.transform='';this.style.boxShadow=''">
          <div class="flex items-center justify-between mb-4">
            <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);margin:0;">Amount Spent</p>
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:rgba(255,212,0,.12);color:#ffd400;" [innerHTML]="safe(icons.wallet)"></div>
          </div>
          <p style="font-size:28px;font-weight:800;letter-spacing:-1px;margin:0;color:var(--text-primary);">&#8377;{{ totalSpent() }}</p>
          <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 0;">Total paid</p>
        </div>
      </div>
    }

    <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
      <div class="card p-5" @fadeUp>
        <div class="flex items-center justify-between mb-4">
          <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">Available Spots</p>
          <span style="font-size:12px;color:var(--accent);">{{ availableSpots().length }} free</span>
        </div>
        <div class="grid gap-2" style="grid-template-columns:repeat(auto-fill,minmax(68px,1fr));max-height:200px;overflow-y:auto;">
          @for (spot of availableSpots().slice(0,12); track spot.spotId) {
            <div class="flex flex-col items-center justify-center rounded-xl border-2 slot-available"
                 style="height:64px;cursor:pointer;transition:transform 180ms ease;"
                 onmouseenter="this.style.transform='scale(1.05)'"
                 onmouseleave="this.style.transform=''">
              <span style="font-size:12px;font-weight:700;">{{ spot.spotNumber }}</span>
              <span style="font-size:9px;opacity:.7;">F{{ spot.floor }}</span>
              <span style="font-size:9px;opacity:.6;">&#8377;{{ spot.pricePerHour }}/h</span>
            </div>
          }
        </div>
        @if (availableSpots().length > 12) {
          <p style="font-size:12px;color:var(--text-secondary);text-align:center;margin:8px 0 0;">+{{ availableSpots().length - 12 }} more</p>
        }
      </div>

      <div class="card p-5" @fadeUp>
        <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0 0 14px;">Recent Bookings</p>
        <div class="space-y-2" style="max-height:230px;overflow-y:auto;">
          @for (b of myBookings().slice(0,8); track b.bookingId) {
            <div class="flex items-center justify-between px-3 py-2 rounded-xl" style="background:var(--bg-secondary);">
              <div>
                <p style="font-size:12px;font-weight:500;color:var(--text-primary);margin:0;">Slot {{ b.spotNumber }}</p>
                <p style="font-size:11px;color:var(--text-secondary);margin:0;">{{ b.startTime | date:'MMM d' }}</p>
              </div>
              <div class="flex items-center gap-2">
                @if (b.totalFare) {
                  <span style="font-size:12px;font-weight:600;color:var(--text-primary);">&#8377;{{ b.totalFare }}</span>
                }
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                      [style.background]="bookingColor(b.status) + '18'"
                      [style.color]="bookingColor(b.status)">{{ b.status }}</span>
              </div>
            </div>
          }
          @if (!myBookings().length) {
            <div class="flex flex-col items-center py-6 gap-2">
              <p style="font-size:13px;color:var(--text-secondary);">No bookings yet</p>
              <a routerLink="/slots" style="font-size:13px;color:var(--accent);text-decoration:none;">Book your first spot</a>
            </div>
          }
        </div>
      </div>
    </div>
    </div>
  `
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  private parking   = inject(ParkingService);
  private booking   = inject(BookingService);
  private authSvc   = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private destroy$  = new Subject<void>();

  icons = ICONS;
  safe(svg: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(svg); }

  firstName = computed(() => (this.authSvc.currentUser()?.fullName ?? 'there').split(' ')[0]);

  loading    = signal(true);
  myBookings = signal<Booking[]>([]);
  spots      = signal<ParkingSpot[]>([]);

  activeBooking  = computed(() => this.myBookings().find(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') ?? null);
  activeCount    = computed(() => this.myBookings().filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN').length);
  totalSpent     = computed(() => this.myBookings().reduce((s, b) => s + (b.totalFare ?? 0), 0));
  availableSpots = computed(() => this.spots().filter(s => s.status === 'AVAILABLE'));

  ngOnInit() {
    forkJoin({
      bookings: this.booking.getMyBookings(),
      spots:    this.parking.getAvailableSpots(this.parking.selectedLotId()),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ bookings, spots }) => {
        this.myBookings.set(bookings);
        this.spots.set(spots);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  doCheckIn(id: number) {
    this.booking.checkIn(id).subscribe(b => {
      this.myBookings.update(bs => bs.map(x => x.bookingId === id ? b : x));
    });
  }

  doCheckOut(id: number) {
    this.booking.checkOut(id).subscribe(b => {
      this.myBookings.update(bs => bs.map(x => x.bookingId === id ? b : x));
    });
  }

  doCancel(id: number) {
    this.booking.cancel(id).subscribe(b => {
      this.myBookings.update(bs => bs.map(x => x.bookingId === id ? b : x));
    });
  }

  bookingColor(status: string) { return BOOKING_STATUS_COLOR[status] ?? '#71767b'; }
}
