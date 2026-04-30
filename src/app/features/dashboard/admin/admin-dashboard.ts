import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { BookingService } from '../../../core/services/booking.service';
import { ParkingLot, Booking } from '../../../core/models/parking.models';
import { StatCardSkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { PremiumCardComponent } from '../../../shared/components/premium-card/premium-card';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { PremiumButtonComponent } from '../../../shared/components/premium-button/premium-button';

const SC: Record<string, string> = {
  CONFIRMED: 'var(--accent)', CHECKED_IN: 'var(--success)', CHECKED_OUT: 'var(--text-secondary)',
  CANCELLED: 'var(--danger)', EXPIRED: 'var(--danger)', PENDING: 'var(--warning)',
};

const I = {
  building: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>`,
  grid:     `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>`,
  check:    `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  clock:    `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  trending: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>`,
  checkSm:  `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>`,
  crossSm:  `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardSkeletonComponent, PremiumCardComponent, StatCardComponent, PremiumButtonComponent],
  template: `
    <div class="max-w-[1400px] mx-auto p-6 md:p-8 min-h-full pb-20 anim-in">

      <!-- Header -->
      <div class="flex items-end justify-between flex-wrap gap-6 mb-10 pb-6 border-b border-white/5 relative">
        <div class="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-danger/50 to-transparent"></div>
        <div class="relative z-10">
          <h1 class="text-[32px] md:text-[40px] font-extrabold text-text-primary m-0 tracking-tight leading-none drop-shadow-sm">System Overview</h1>
          <p class="text-[15px] text-text-secondary mt-2 font-medium tracking-wide">Platform-wide · live operations data</p>
        </div>
        <div class="flex items-center gap-3 relative z-10">
          <span class="text-[11px] font-black tracking-widest uppercase text-danger bg-danger/10 border border-danger/20 px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.2)]">
            Superuser
          </span>
        </div>
      </div>

      <div class="space-y-6 lg:space-y-8">

        <!-- Stat cards -->
        @if (loading()) {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            @for (i of [1,2,3,4,5]; track i) { <app-stat-card-skeleton /> }
          </div>
        } @else {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 anim-in anim-d1">
            @for (c of adminStats(); track c.label) {
              <app-stat-card
                [label]="c.label"
                [value]="c.value"
                [color]="c.color"
                [icon]="c.icon"
              />
            }
          </div>
        }

        <!-- Mid row: lots + pending -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 anim-in anim-d2">

          <!-- All Lots -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(34,211,238,0.8)] pulse-dot"></span>
                <h2 class="text-[18px] font-bold text-text-primary m-0 tracking-tight">Active Parking Lots</h2>
              </div>
              <span class="text-xs text-text-secondary font-bold uppercase tracking-wider">{{ lots().length }} total</span>
            </div>
            
            <div class="glass-panel rounded-3xl overflow-hidden shadow-xl flex flex-col h-[400px]">
              <div class="flex-1 overflow-y-auto main-scroll p-2">
                @for (lot of lots(); track lot.lotId) {
                  <div class="flex items-center gap-4 p-4 rounded-2xl hover:bg-bg-hover/50 border border-transparent hover:border-white/5 transition-all group mb-1">
                    <div class="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <span [innerHTML]="safe(ic.building)" class="text-accent scale-75"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[15px] font-extrabold text-text-primary m-0 group-hover:text-accent transition-colors">{{ lot.name }}</p>
                      <p class="text-[12px] text-text-secondary m-0 font-medium">{{ lot.city }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-[16px] font-black text-text-primary m-0 tracking-tight">
                        {{ lot.availableSpots }} <span class="text-[12px] text-text-secondary font-medium">/ {{ lot.totalSpots }}</span>
                      </p>
                      <span class="text-[10px] font-black uppercase tracking-widest mt-1 block"
                            [class.text-success]="lot.status === 'ACTIVE'"
                            [class.text-warning]="lot.status !== 'ACTIVE'">
                        {{ lot.status }}
                      </span>
                    </div>
                  </div>
                }
                @if (!lots().length && !loading()) {
                  <div class="h-full flex flex-col items-center justify-center opacity-60 p-10">
                    <span [innerHTML]="safe(ic.building)" class="text-text-secondary mb-4 scale-150"></span>
                    <p class="text-[14px] text-text-secondary m-0 font-medium">No parking lots configured.</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Pending Approvals -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-warning shadow-[0_0_8px_rgba(251,191,36,0.8)]" [class.pulse-dot]="pendingLots().length > 0"></span>
                <h2 class="text-[18px] font-bold text-text-primary m-0 tracking-tight">Pending Approvals</h2>
              </div>
              @if (pendingLots().length) {
                <span class="text-[11px] font-black tracking-widest text-warning bg-warning/10 border border-warning/20 px-3 py-1 rounded-full uppercase">
                  {{ pendingLots().length }} waiting
                </span>
              }
            </div>
            
            <div class="glass-panel rounded-3xl overflow-hidden shadow-xl flex flex-col h-[400px]">
              <div class="flex-1 overflow-y-auto main-scroll p-2">
                @for (lot of pendingLots(); track lot.lotId) {
                  <div class="p-5 rounded-2xl border border-transparent hover:border-white/5 hover:bg-bg-hover/50 transition-all group mb-2">
                    <div class="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p class="text-[16px] font-extrabold text-text-primary m-0">{{ lot.name }}</p>
                        <p class="text-[12px] text-text-secondary mt-1 m-0 font-medium">{{ lot.address }}, {{ lot.city }}</p>
                      </div>
                    </div>
                    <div class="flex gap-3 mt-4">
                      <app-premium-button variant="ghost" size="sm" class="flex-1" (onClick)="approveLot(lot.lotId)">
                        <div class="flex items-center justify-center gap-2 text-success">
                          <span [innerHTML]="safe(ic.checkSm)"></span> Approve
                        </div>
                      </app-premium-button>
                      <app-premium-button variant="danger" size="sm" class="flex-1" (onClick)="rejectLot(lot.lotId)">
                        <div class="flex items-center justify-center gap-2">
                          <span [innerHTML]="safe(ic.crossSm)"></span> Reject
                        </div>
                      </app-premium-button>
                    </div>
                  </div>
                }
                @if (!pendingLots().length && !loading()) {
                  <div class="h-full flex flex-col items-center justify-center opacity-60 p-10">
                    <div class="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                         [innerHTML]="safe(ic.check)"></div>
                    <p class="text-[14px] text-text-secondary m-0 font-medium">All caught up</p>
                  </div>
                }
              </div>
            </div>
          </div>

        </div>

        <!-- Recent Bookings -->
        <div class="flex flex-col gap-4 anim-in anim-d3">
          <div class="flex items-center justify-between px-2">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full" style="background:#a855f7; box-shadow: 0 0 8px rgba(168,85,247,0.8);"></span>
              <h2 class="text-[18px] font-bold text-text-primary m-0 tracking-tight">Recent Global Bookings</h2>
            </div>
            <span class="text-xs text-text-secondary font-bold uppercase tracking-wider">{{ recentBookings().length }} shown</span>
          </div>

          <div class="glass-panel rounded-3xl overflow-hidden shadow-xl">
            <div class="p-2">
              @for (b of recentBookings(); track b.bookingId) {
                <div class="flex items-center gap-4 p-4 rounded-2xl hover:bg-bg-hover/50 border border-transparent hover:border-white/5 transition-all group mb-1">
                  <div class="w-3 h-3 rounded-full shrink-0 shadow-inner" [style.background]="sColor(b.status)"></div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-1">
                      <p class="text-[15px] font-extrabold text-text-primary m-0">Slot {{ b.spotNumber }}</p>
                      <span class="font-mono text-[11px] font-bold text-text-secondary bg-bg-card border border-border px-2 py-0.5 rounded-md">{{ b.vehiclePlate }}</span>
                    </div>
                    <p class="text-[12px] text-text-secondary m-0 font-medium">{{ b.startTime | date:'MMM d, HH:mm' }}</p>
                  </div>
                  
                  <div class="flex items-center gap-6 shrink-0">
                    <div class="text-right hidden sm:block">
                      @if (b.totalFare) {
                        <p class="text-[16px] font-black text-text-primary m-0 tracking-tight">₹{{ b.totalFare }}</p>
                      }
                      <p class="text-[10px] font-black uppercase tracking-widest mt-1 m-0"
                         [style.color]="sColor(b.status)">{{ b.status }}</p>
                    </div>
                          
                    @if (b.status === 'CHECKED_IN') {
                      <app-premium-button variant="danger" size="sm" (onClick)="forceCheckout(b.bookingId)">
                        Force out
                      </app-premium-button>
                    } @else {
                      <div class="w-[85px] hidden sm:block"></div>
                    }
                  </div>
                </div>
              }
              @if (!recentBookings().length && !loading()) {
                <div class="p-10 text-center opacity-60">
                  <p class="text-[14px] text-text-secondary m-0 font-medium">No bookings yet across the platform.</p>
                </div>
              }
            </div>
          </div>
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

  readonly ic = I;
  safe(svg: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(svg); }

  loading         = signal(true);
  lots            = signal<ParkingLot[]>([]);
  pendingLots     = signal<ParkingLot[]>([]);
  allBookings     = signal<Booking[]>([]);
  platformRevenue = signal<number>(0);

  recentBookings = computed(() => this.allBookings().slice(0, 12));

  adminStats = computed<{label: string, value: string | number, color: string, icon: string}[]>(() => [
    { label: 'Total Lots',  value: this.lots().length,                                    color: 'var(--accent)', icon: I.building },
    { label: 'Total Spots', value: this.lots().reduce((s, l) => s + l.totalSpots, 0),     color: 'var(--text-secondary)', icon: I.grid     },
    { label: 'Free Now',    value: this.lots().reduce((s, l) => s + l.availableSpots, 0), color: 'var(--success)', icon: I.check    },
    { label: 'Pending',     value: this.pendingLots().length,                             color: 'var(--warning)', icon: I.clock    },
    { label: 'Revenue',     value: `₹${this.platformRevenue()}`,                          color: '#a855f7', icon: I.trending },
  ]);

  ngOnInit() {
    forkJoin({
      lots:    this.parking.getLots(),
      pending: this.parking.getPendingLots(),
      all:     this.booking.getAllBookings(),
      revenue: this.http.get<number>('/api/v1/payments/admin/revenue/platform/all'),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ lots, pending, all, revenue }) => {
        this.lots.set(lots); this.pendingLots.set(pending);
        this.allBookings.set(all); this.platformRevenue.set(revenue ?? 0);
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

  sColor(s: string) { return SC[s] ?? 'var(--text-secondary)'; }
}
