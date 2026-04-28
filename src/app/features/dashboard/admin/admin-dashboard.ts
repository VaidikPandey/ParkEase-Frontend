import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { BookingService } from '../../../core/services/booking.service';
import { ParkingLot, Booking } from '../../../core/models/parking.models';
import { StatCardSkeletonComponent } from '../../../shared/components/skeleton/skeleton';

const BOOKING_STATUS_COLOR: Record<string, string> = {
  CONFIRMED: '#1d9bf0', CHECKED_IN: '#00ba7c', CHECKED_OUT: '#71767b',
  CANCELLED: '#f4212e', EXPIRED: '#f4212e', PENDING: '#ffd400',
};

const ICONS = {
  lots:      `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>`,
  spots:     `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>`,
  available: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  pending:   `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  revenue:   `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  check:     `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>`,
  cross:     `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardSkeletonComponent],
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
        <h2 style="font-size:22px;font-weight:800;color:var(--text-primary);margin:0;letter-spacing:-.4px;">System Overview</h2>
        <p style="color:var(--text-secondary);font-size:13px;margin:4px 0 0;">All lots · live data</p>
      </div>
      <span class="px-3 py-1 rounded-full text-xs font-bold"
            style="background:rgba(244,33,46,.1);color:#f4212e;border:1px solid rgba(244,33,46,.2);">ADMIN</span>
    </div>

    @if (loading()) {
      <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
        @for (i of [1,2,3,4]; track i) { <app-stat-card-skeleton /> }
      </div>
    } @else {
      <div class="grid gap-4" [@stagger]="adminStats().length"
           style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
        @for (c of adminStats(); track c.label) {
          <div class="card p-5"
               style="transition:transform 200ms ease,box-shadow 200ms ease;"
               onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,.15)'"
               onmouseleave="this.style.transform='';this.style.boxShadow=''">
            <div class="flex items-center justify-between mb-4">
              <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);margin:0;">{{ c.label }}</p>
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                   [style.background]="c.color + '18'" [style.color]="c.color"
                   [innerHTML]="safe(c.icon)"></div>
            </div>
            <p style="font-size:34px;font-weight:800;letter-spacing:-1px;margin:0;" [style.color]="c.color">{{ c.value }}</p>
            <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 0;">{{ c.sub }}</p>
          </div>
        }
      </div>
    }

    <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
      <!-- All lots -->
      <div class="card p-5" @fadeUp>
        <div class="flex items-center justify-between mb-4">
          <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">Parking Lots</p>
          <span style="font-size:12px;color:var(--text-secondary);">{{ lots().length }} total</span>
        </div>
        <div class="space-y-2" style="max-height:280px;overflow-y:auto;">
          @for (lot of lots(); track lot.lotId) {
            <div class="flex items-center justify-between px-3 py-2.5 rounded-xl"
                 style="background:var(--bg-secondary);">
              <div>
                <p style="font-size:13px;font-weight:600;color:var(--text-primary);margin:0;">{{ lot.name }}</p>
                <p style="font-size:11px;color:var(--text-secondary);margin:0;">{{ lot.city }}</p>
              </div>
              <div class="text-right">
                <p style="font-size:13px;font-weight:700;color:var(--text-primary);margin:0;">{{ lot.availableSpots }}/{{ lot.totalSpots }}</p>
                <span class="text-xs px-2 py-0.5 rounded-full font-semibold"
                      [style.background]="lot.status === 'ACTIVE' ? 'rgba(0,186,124,.1)' : 'rgba(255,212,0,.1)'"
                      [style.color]="lot.status === 'ACTIVE' ? '#00ba7c' : '#ffd400'">
                  {{ lot.status }}
                </span>
              </div>
            </div>
          }
          @if (!lots().length) {
            <p style="font-size:13px;color:var(--text-secondary);text-align:center;padding:20px 0;">No lots yet</p>
          }
        </div>
      </div>

      <!-- Pending approvals -->
      <div class="card p-5" @fadeUp>
        <div class="flex items-center justify-between mb-4">
          <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">Pending Approvals</p>
          @if (pendingLots().length) {
            <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                  style="background:rgba(255,212,0,.15);color:#ffd400;">{{ pendingLots().length }}</span>
          }
        </div>
        <div class="space-y-2" style="max-height:280px;overflow-y:auto;">
          @for (lot of pendingLots(); track lot.lotId) {
            <div class="px-3 py-3 rounded-xl" style="background:var(--bg-secondary);">
              <p style="font-size:13px;font-weight:600;color:var(--text-primary);margin:0 0 2px;">{{ lot.name }}</p>
              <p style="font-size:11px;color:var(--text-secondary);margin:0 0 10px;">{{ lot.address }}, {{ lot.city }}</p>
              <div class="flex gap-2">
                <button (click)="approveLot(lot.lotId)"
                        class="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        style="background:rgba(0,186,124,.1);color:#00ba7c;border:1px solid rgba(0,186,124,.2);cursor:pointer;">
                  <span [innerHTML]="safe(icons.check)"></span> Approve
                </button>
                <button (click)="rejectLot(lot.lotId)"
                        class="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        style="background:rgba(244,33,46,.08);color:#f4212e;border:1px solid rgba(244,33,46,.2);cursor:pointer;">
                  <span [innerHTML]="safe(icons.cross)"></span> Reject
                </button>
              </div>
            </div>
          }
          @if (!pendingLots().length) {
            <div class="flex flex-col items-center py-8 gap-2">
              <div style="color:#00ba7c;" [innerHTML]="safe(icons.available)"></div>
              <p style="font-size:13px;color:var(--text-secondary);margin:0;">All caught up</p>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Recent bookings (all) -->
    <div class="card p-5" @fadeUp>
      <div class="flex items-center justify-between mb-4">
        <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">Recent Bookings</p>
        <span style="font-size:12px;color:var(--text-secondary);">{{ recentBookings().length }} shown</span>
      </div>
      <div class="space-y-2">
        @for (b of recentBookings(); track b.bookingId) {
          <div class="flex items-center justify-between px-3 py-2.5 rounded-xl"
               style="background:var(--bg-secondary);">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full flex-shrink-0" [style.background]="bookingColor(b.status)"></div>
              <div>
                <p style="font-size:13px;font-weight:500;color:var(--text-primary);margin:0;">Slot {{ b.spotNumber }} · {{ b.vehiclePlate }}</p>
                <p style="font-size:11px;color:var(--text-secondary);margin:0;">{{ b.startTime | date:'MMM d, HH:mm' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              @if (b.totalFare) {
                <span style="font-size:13px;font-weight:600;color:var(--text-primary);">&#8377;{{ b.totalFare }}</span>
              }
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                    [style.background]="bookingColor(b.status) + '18'"
                    [style.color]="bookingColor(b.status)">{{ b.status }}</span>
              @if (b.status === 'CHECKED_IN') {
                <button (click)="forceCheckout(b.bookingId)"
                        style="font-size:11px;color:#f4212e;background:rgba(244,33,46,.08);border:1px solid rgba(244,33,46,.2);border-radius:8px;padding:3px 10px;cursor:pointer;">
                  Force out
                </button>
              }
            </div>
          </div>
        }
        @if (!recentBookings().length) {
          <p style="font-size:13px;color:var(--text-secondary);text-align:center;padding:20px 0;">No bookings yet</p>
        }
      </div>
    </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private parking   = inject(ParkingService);
  private booking   = inject(BookingService);
  private http      = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private destroy$  = new Subject<void>();

  icons = ICONS;
  safe(svg: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(svg); }

  loading        = signal(true);
  lots           = signal<ParkingLot[]>([]);
  pendingLots    = signal<ParkingLot[]>([]);
  allBookings    = signal<Booking[]>([]);
  platformRevenue = signal<number>(0);

  recentBookings = computed(() => this.allBookings().slice(0, 10));

  adminStats = computed(() => [
    { label: 'Total Lots',     value: this.lots().length,                                    color: '#1d9bf0',             icon: ICONS.lots,      sub: 'Registered lots' },
    { label: 'Total Spots',    value: this.lots().reduce((s, l) => s + l.totalSpots, 0),     color: 'var(--text-primary)', icon: ICONS.spots,     sub: 'Across all lots' },
    { label: 'Available',      value: this.lots().reduce((s, l) => s + l.availableSpots, 0), color: '#00ba7c',             icon: ICONS.available, sub: 'Free right now' },
    { label: 'Pending Review', value: this.pendingLots().length,                             color: '#ffd400',             icon: ICONS.pending,   sub: 'Needs approval' },
    { label: 'Total Revenue',  value: `₹${this.platformRevenue()}`,                          color: '#a855f7',             icon: ICONS.revenue,   sub: 'Actual payments collected' },
  ]);

  ngOnInit() {
    forkJoin({
      lots:    this.parking.getLots(),
      pending: this.parking.getPendingLots(),
      all:     this.booking.getAllBookings(),
      revenue: this.http.get<number>('/api/v1/payments/admin/revenue/platform/all'),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ lots, pending, all, revenue }) => {
        this.lots.set(lots);
        this.pendingLots.set(pending);
        this.allBookings.set(all);
        this.platformRevenue.set(revenue ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  approveLot(id: number) {
    this.parking.approveLot(id).subscribe(() => {
      this.pendingLots.update(ls => ls.filter(l => l.lotId !== id));
      this.parking.getLots().subscribe(lots => this.lots.set(lots));
    });
  }

  rejectLot(id: number) {
    this.parking.rejectLot(id).subscribe(() => {
      this.pendingLots.update(ls => ls.filter(l => l.lotId !== id));
    });
  }

  forceCheckout(id: number) {
    this.booking.forceCheckout(id).subscribe(b => {
      this.allBookings.update(bs => bs.map(x => x.bookingId === id ? b : x));
    });
  }

  bookingColor(status: string) { return BOOKING_STATUS_COLOR[status] ?? '#71767b'; }
}
