import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingSpot, Booking } from '../../../core/models/parking.models';
import { StatCardSkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { PremiumCardComponent } from '../../../shared/components/premium-card/premium-card';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { PremiumButtonComponent } from '../../../shared/components/premium-button/premium-button';

const SC: Record<string, string> = {
  CONFIRMED: '#1d9bf0', CHECKED_IN: '#00ba7c', CHECKED_OUT: '#71767b',
  CANCELLED: '#f4212e', EXPIRED: '#f4212e', PENDING: '#ffd400',
};

const I = {
  calendar: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>`,
  zap:      `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>`,
  wallet:   `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75"/></svg>`,
};

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardSkeletonComponent, PremiumCardComponent, StatCardComponent, PremiumButtonComponent],
  template: `
    <div class="max-w-[1400px] mx-auto p-6 md:p-8 min-h-full pb-20 anim-in">

      <!-- Header -->
      <div class="flex items-end justify-between flex-wrap gap-6 mb-10 pb-6 border-b border-white/5 relative">
        <div class="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-accent/50 to-transparent"></div>
        <div class="relative z-10">
          <h1 class="text-[32px] md:text-[40px] font-extrabold text-text-primary m-0 tracking-tight leading-none drop-shadow-sm">Good day, {{ firstName() }}</h1>
          <p class="text-[15px] text-text-secondary mt-2 font-medium tracking-wide">Your personal parking overview</p>
        </div>
        <div class="flex items-center gap-3 relative z-10">
          <span class="text-[11px] font-black tracking-widest uppercase text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            Driver
          </span>
          <app-premium-button variant="primary" size="sm" routerLink="/slots">
            Book a Spot
          </app-premium-button>
        </div>
      </div>

      <!-- Stat cards -->
      @if (loading()) {
        <div class="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3 mb-8">
          @for (i of [1,2,3]; track i) { <app-stat-card-skeleton /> }
        </div>
      } @else {
        <div class="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3 mb-8 anim-in anim-d1">
          @for (c of stats(); track c.label) {
            <app-stat-card [label]="c.label" [value]="c.value" [color]="c.color" [icon]="c.icon" />
          }
        </div>
      }

      <!-- Active booking banner -->
      @if (activeBooking()) {
        <div class="anim-in anim-d2 mb-8 relative group overflow-hidden glass-panel p-6 rounded-3xl border border-accent/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
          <!-- Glow -->
          <div class="absolute -left-20 -top-20 w-64 h-64 bg-accent/10 blur-3xl rounded-full transition-opacity group-hover:opacity-100 opacity-70 pointer-events-none"></div>
          
          <div class="flex items-center justify-between gap-6 flex-wrap relative z-10">
            <div class="flex items-center gap-5">
              <div class="w-14 h-14 rounded-2xl bg-accent/10 text-accent border border-accent/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.2)]" [innerHTML]="safe(ic.zap)"></div>
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <p class="text-[11px] font-black text-accent uppercase tracking-widest m-0">Active Booking</p>
                  <span class="w-2 h-2 rounded-full bg-accent pulse-dot"></span>
                </div>
                <p class="text-[24px] font-extrabold text-text-primary m-0 tracking-tight">Slot {{ activeBooking()!.spotNumber }}</p>
                <p class="text-[14px] text-text-secondary m-0 mt-1 font-medium">
                  {{ activeBooking()!.startTime | date:'MMM d, HH:mm' }} &nbsp;–&nbsp; {{ activeBooking()!.endTime | date:'HH:mm' }}
                  <span class="ml-3 font-mono text-[12px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-text-primary shadow-inner">
                    {{ activeBooking()!.vehiclePlate }}
                  </span>
                </p>
              </div>
            </div>
            <div class="flex gap-3">
              @if (activeBooking()!.status === 'CONFIRMED') {
                <app-premium-button variant="primary" size="sm" (onClick)="doCheckIn(activeBooking()!.bookingId)">
                  Check In
                </app-premium-button>
                <button (click)="doCancel(activeBooking()!.bookingId)"
                        class="px-5 py-2.5 rounded-2xl font-bold text-[13px] bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                  Cancel
                </button>
              }
              @if (activeBooking()!.status === 'CHECKED_IN') {
                <button (click)="doCheckOut(activeBooking()!.bookingId)"
                        class="px-6 py-3 rounded-2xl font-bold text-[14px] bg-white text-black hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  Check Out
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Grid Layout -->
      <div class="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2 anim-in anim-d3">

        <!-- Available spots -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between px-2">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)] pulse-dot"></span>
              <h2 class="text-[18px] font-bold text-text-primary m-0 tracking-tight">Available Spots</h2>
            </div>
            <span class="text-xs text-text-secondary font-bold uppercase tracking-wider">{{ availableSpots().length }} free</span>
          </div>

          <div class="glass-panel p-5 rounded-3xl min-h-[250px] relative overflow-hidden flex flex-col">
            @if (loading()) {
              <div class="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
            } @else if (!availableSpots().length) {
              <div class="flex-1 flex flex-col items-center justify-center p-8 opacity-60">
                <span class="text-4xl mb-3">🅿️</span>
                <p class="text-[14px] text-text-secondary m-0 font-medium">No spots available right now</p>
              </div>
            } @else {
              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto main-scroll pr-2">
                @for (spot of availableSpots().slice(0, 20); track spot.spotId) {
                  <div class="rounded-xl border border-white/5 p-3 text-center cursor-pointer transition-all duration-300 hover:bg-success/10 hover:border-success/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:-translate-y-1">
                    <p class="text-[16px] font-extrabold text-text-primary m-0 tracking-tight">{{ spot.spotNumber }}</p>
                    <p class="text-[10px] text-text-secondary m-0 mt-1 font-bold">F{{ spot.floor }}</p>
                    <p class="text-[11px] text-success m-0 mt-2 font-black">₹{{ spot.pricePerHour }}/h</p>
                  </div>
                }
              </div>
              @if (availableSpots().length > 20) {
                <p class="text-[12px] text-text-secondary font-bold text-center mt-4">
                  +{{ availableSpots().length - 20 }} more spots
                </p>
              }
            }
          </div>
        </div>

        <!-- Recent bookings -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between px-2">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(34,211,238,0.8)] pulse-dot"></span>
              <h2 class="text-[18px] font-bold text-text-primary m-0 tracking-tight">Recent Bookings</h2>
            </div>
            <span class="text-xs text-text-secondary font-bold uppercase tracking-wider">{{ myBookings().length }} total</span>
          </div>

          <div class="glass-panel rounded-3xl min-h-[250px] overflow-hidden flex flex-col">
            @if (!myBookings().length) {
              <div class="flex-1 flex flex-col items-center justify-center p-10 opacity-60">
                <span class="text-4xl mb-4 text-text-secondary">🎫</span>
                <p class="text-[14px] text-text-secondary m-0 mb-4 font-medium">No bookings yet</p>
                <a routerLink="/slots" class="text-[13px] font-bold text-accent hover:underline">Book your first spot →</a>
              </div>
            } @else {
              <div class="flex-1 max-h-[340px] overflow-y-auto main-scroll p-2">
                @for (b of myBookings().slice(0, 8); track b.bookingId) {
                  <div class="flex items-center gap-4 p-4 rounded-2xl hover:bg-bg-hover/50 border border-transparent hover:border-white/5 transition-all mb-1 group">
                    <div class="w-3 h-3 rounded-full shrink-0 shadow-inner" [style.background]="sColor(b.status)"></div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[15px] font-extrabold text-text-primary m-0 group-hover:text-accent transition-colors">Slot {{ b.spotNumber }}</p>
                      <p class="text-[12px] text-text-secondary font-medium m-0 mt-1">{{ b.startTime | date:'MMM d, HH:mm' }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      @if (b.totalFare) {
                        <p class="text-[16px] font-black text-text-primary m-0 tracking-tight">₹{{ b.totalFare }}</p>
                      }
                      <p class="text-[10px] font-black uppercase tracking-widest mt-1 m-0"
                         [style.color]="sColor(b.status)">{{ b.status }}</p>
                    </div>
                  </div>
                }
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

  readonly ic = I;
  safe(svg: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(svg); }

  firstName  = computed(() => (this.authSvc.currentUser()?.fullName ?? 'there').split(' ')[0]);
  loading    = signal(true);
  myBookings = signal<Booking[]>([]);
  spots      = signal<ParkingSpot[]>([]);

  activeBooking  = computed(() => this.myBookings().find(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') ?? null);
  availableSpots = computed(() => this.spots().filter(s => s.status === 'AVAILABLE'));
  activeCount    = computed(() => this.myBookings().filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN').length);
  totalSpent     = computed(() => this.myBookings().reduce((s, b) => s + (b.totalFare ?? 0), 0));

  stats = computed(() => [
    { label: 'Total Bookings', value: this.myBookings().length, color: '#1d9bf0', icon: I.calendar },
    { label: 'Active Now',     value: this.activeCount(),       color: '#00ba7c', icon: I.zap     },
    { label: 'Total Spent',    value: `₹${this.totalSpent()}`,  color: '#ffd400', icon: I.wallet  },
  ]);

  ngOnInit() {
    this.booking.getMyBookings().pipe(takeUntil(this.destroy$)).subscribe({
      next: b => this.myBookings.set(b), error: () => {}
    });
    this.parking.getApprovedLots().pipe(
      takeUntil(this.destroy$),
      switchMap(lots => {
        const first = lots.find(l => l.status === 'ACTIVE') ?? lots[0];
        if (first) this.parking.selectedLotId.set(first.lotId);
        return first ? this.parking.getAvailableSpots(first.lotId) : of([]);
      })
    ).subscribe({
      next: spots => { this.spots.set(spots); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  doCheckIn(id: number)  { this.booking.checkIn(id).subscribe(b  => this.myBookings.update(bs => bs.map(x => x.bookingId === id ? b  : x))); }
  doCheckOut(id: number) { this.booking.checkOut(id).subscribe(b => this.myBookings.update(bs => bs.map(x => x.bookingId === id ? b  : x))); }
  doCancel(id: number)   { this.booking.cancel(id).subscribe(b   => this.myBookings.update(bs => bs.map(x => x.bookingId === id ? b  : x))); }
  sColor(s: string)      { return SC[s] ?? '#71767b'; }
}
