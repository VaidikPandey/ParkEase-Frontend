import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { BookingService } from '../../../core/services/booking.service';
import { ParkingLot, Booking } from '../../../core/models/parking.models';
import { StatCardSkeletonComponent } from '../../../shared/components/skeleton/skeleton';

const BOOKING_STATUS_COLOR: Record<string, string> = {
  CONFIRMED: '#1d9bf0', CHECKED_IN: '#00ba7c', CHECKED_OUT: '#71767b',
  CANCELLED: '#f4212e', EXPIRED: '#f4212e', PENDING: '#ffd400',
};

const ICONS = {
  lots:    `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>`,
  spots:   `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>`,
  car:     `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`,
  revenue: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
};

@Component({
  selector: 'app-manager-dashboard',
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
        <h2 style="font-size:22px;font-weight:800;color:var(--text-primary);margin:0;letter-spacing:-.4px;">My Lots</h2>
        <p style="color:var(--text-secondary);font-size:13px;margin:4px 0 0;">Operations overview · live</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-xs font-bold"
              style="background:rgba(255,212,0,.1);color:#ffd400;border:1px solid rgba(255,212,0,.2);">MANAGER</span>
        <a routerLink="/slots" class="btn-accent"
           style="font-size:13px;padding:7px 16px;border-radius:9999px;text-decoration:none;">Manage Slots</a>
      </div>
    </div>

    @if (loading()) {
      <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
        @for (i of [1,2,3,4]; track i) { <app-stat-card-skeleton /> }
      </div>
    } @else {
      <div class="grid gap-4" [@stagger]="managerStats().length"
           style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
        @for (c of managerStats(); track c.label) {
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

    @if (myLots().length) {
      <div class="grid gap-4" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));" @fadeUp>
        @for (lot of myLots(); track lot.lotId) {
          <div class="card p-5 cursor-pointer"
               style="transition:transform 200ms ease,box-shadow 200ms ease,border-color 200ms ease;"
               (click)="selectLot(lot.lotId)"
               [style.border-color]="parking.selectedLotId() === lot.lotId ? 'var(--accent)' : ''"
               onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,.12)'"
               onmouseleave="this.style.transform='';this.style.boxShadow=''">
            <div class="flex items-start justify-between mb-3">
              <div>
                <p style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0;">{{ lot.name }}</p>
                <p style="font-size:12px;color:var(--text-secondary);margin:2px 0 0;">{{ lot.address }}</p>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                    [style.background]="lot.status === 'ACTIVE' ? 'rgba(0,186,124,.1)' : 'rgba(244,33,46,.08)'"
                    [style.color]="lot.status === 'ACTIVE' ? '#00ba7c' : '#f4212e'">
                {{ lot.status }}
              </span>
            </div>
            <div class="mb-3">
              <div class="flex justify-between mb-1">
                <span style="font-size:11px;color:var(--text-secondary);">Occupancy</span>
                <span style="font-size:11px;font-weight:600;color:var(--text-primary);">
                  {{ lot.totalSpots - lot.availableSpots }}/{{ lot.totalSpots }}
                </span>
              </div>
              <div style="height:4px;background:var(--border);border-radius:99px;overflow:hidden;">
                <div style="height:100%;border-radius:99px;background:var(--accent);transition:width 600ms ease;"
                     [style.width]="lot.totalSpots ? ((lot.totalSpots - lot.availableSpots) / lot.totalSpots * 100) + '%' : '0%'"></div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span style="font-size:12px;color:var(--text-secondary);">{{ lot.openingTime }} – {{ lot.closingTime }}</span>
              <button (click)="toggleLot(lot.lotId, $event)"
                      style="margin-left:auto;font-size:11px;padding:3px 10px;border-radius:8px;cursor:pointer;border:1px solid var(--border);background:var(--bg-hover);color:var(--text-secondary);">
                Toggle
              </button>
            </div>
          </div>
        }
      </div>
    }

    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">
          Bookings — {{ selectedLotName() }}
        </p>
        <span style="font-size:12px;color:var(--text-secondary);">{{ lotBookings().length }} total</span>
      </div>
      <div class="space-y-2" style="max-height:300px;overflow-y:auto;">
        @for (b of lotBookings(); track b.bookingId) {
          <div class="flex items-center justify-between px-3 py-2.5 rounded-xl"
               style="background:var(--bg-secondary);">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full" [style.background]="bookingColor(b.status)"></div>
              <div>
                <p style="font-size:13px;font-weight:500;color:var(--text-primary);margin:0;">Slot {{ b.spotNumber }} · {{ b.vehiclePlate }}</p>
                <p style="font-size:11px;color:var(--text-secondary);margin:0;">{{ b.startTime | date:'MMM d, HH:mm' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              @if (b.totalFare) {
                <span style="font-size:13px;font-weight:600;color:var(--text-primary);">&#8377;{{ b.totalFare }}</span>
              }
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                    [style.background]="bookingColor(b.status) + '18'"
                    [style.color]="bookingColor(b.status)">{{ b.status }}</span>
            </div>
          </div>
        }
        @if (!lotBookings().length) {
          <p style="font-size:13px;color:var(--text-secondary);text-align:center;padding:20px 0;">No bookings for this lot</p>
        }
      </div>
    </div>
    </div>
  `
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  parking  = inject(ParkingService);
  private booking   = inject(BookingService);
  private sanitizer = inject(DomSanitizer);
  private destroy$  = new Subject<void>();

  icons = ICONS;
  safe(svg: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(svg); }

  loading    = signal(true);
  myLots     = signal<ParkingLot[]>([]);
  lotBookings = signal<Booking[]>([]);

  selectedLotName = computed(() =>
    this.myLots().find(l => l.lotId === this.parking.selectedLotId())?.name ?? `Lot ${this.parking.selectedLotId()}`
  );

  managerStats = computed(() => {
    const ls = this.myLots();
    const bs = this.lotBookings();
    const active = bs.filter(b => b.status === 'CHECKED_IN').length;
    const rev = bs.reduce((s, b) => s + (b.totalFare ?? 0), 0);
    return [
      { label: 'My Lots',     value: ls.length,                                color: '#1d9bf0',             icon: ICONS.lots,    sub: 'Managed by you' },
      { label: 'Total Spots', value: ls.reduce((s, l) => s + l.totalSpots, 0), color: 'var(--text-primary)', icon: ICONS.spots,   sub: 'All your lots' },
      { label: 'Active Now',  value: active,                                   color: '#00ba7c',             icon: ICONS.car,     sub: 'Currently parked' },
      { label: 'Revenue',     value: `₹${rev}`,                                color: '#ffd400',             icon: ICONS.revenue, sub: 'Total collected' },
    ];
  });

  ngOnInit() {
    this.parking.getManagerLots().pipe(takeUntil(this.destroy$)).subscribe({
      next: lots => {
        this.myLots.set(lots);
        if (lots.length) {
          const lotId = lots[0].lotId;
          this.parking.selectedLotId.set(lotId);
          this.loadLotData(lotId);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  private loadLotData(lotId: number) {
    this.booking.getBookingsByLot(lotId).pipe(takeUntil(this.destroy$)).subscribe({
      next: bs => this.lotBookings.set(bs),
      error: () => {}
    });
  }

  selectLot(lotId: number) {
    this.parking.selectedLotId.set(lotId);
    this.loadLotData(lotId);
  }

  toggleLot(id: number, e: Event) {
    e.stopPropagation();
    this.parking.toggleLot(id).subscribe(updated => {
      this.myLots.update(ls => ls.map(l => l.lotId === id ? updated : l));
    });
  }

  bookingColor(status: string) { return BOOKING_STATUS_COLOR[status] ?? '#71767b'; }
}
