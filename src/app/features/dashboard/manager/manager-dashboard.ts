import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { BookingService } from '../../../core/services/booking.service';
import { ParkingLot, Booking } from '../../../core/models/parking.models';
import { StatCardSkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { PremiumButtonComponent } from '../../../shared/components/premium-button/premium-button';

const SC: Record<string, string> = {
  CONFIRMED: '#1d9bf0', CHECKED_IN: '#00ba7c', CHECKED_OUT: '#71767b',
  CANCELLED: '#f4212e', EXPIRED: '#f4212e', PENDING: '#ffd400',
};

const I = {
  building: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>`,
  grid:     `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>`,
  car:      `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`,
  trending: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>`,
  bar:      `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>`,
};

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardSkeletonComponent, StatCardComponent, PremiumButtonComponent],
  template: `
    <div class="max-w-[1400px] mx-auto p-6 md:p-8 min-h-full pb-20 anim-in">

      <!-- Header -->
      <div class="flex items-end justify-between flex-wrap gap-6 mb-10 pb-6 border-b border-white/5 relative">
        <div class="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-accent/50 to-transparent"></div>
        <div class="relative z-10">
          <h1 class="text-[32px] md:text-[40px] font-extrabold text-text-primary m-0 tracking-tight leading-none drop-shadow-sm">My Operations</h1>
          <p class="text-[15px] text-text-secondary mt-2 font-medium tracking-wide">Live overview across all your assigned lots</p>
        </div>
        <div class="flex items-center gap-3 relative z-10">
          <span class="text-[11px] font-black tracking-widest uppercase text-warning bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.2)]">
            Manager
          </span>
          <app-premium-button variant="ghost" size="sm" (onClick)="router.navigate(['/analytics'])">
            <span [innerHTML]="safe(ic.bar)" class="mr-1"></span> Analytics
          </app-premium-button>
          <app-premium-button variant="primary" size="sm" (onClick)="router.navigate(['/slots'])">
            Manage Slots
          </app-premium-button>
        </div>
      </div>

      <!-- Stat cards -->
      @if (loading()) {
        <div class="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
          @for (i of [1,2,3,4]; track i) { <app-stat-card-skeleton /> }
        </div>
      } @else {
        <div class="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-8 anim-in anim-d1">
          @for (c of managerStats(); track c.label) {
            <app-stat-card [label]="c.label" [value]="c.value" [color]="c.color" [icon]="c.icon" />
          }
        </div>
      }

      <!-- Lots + Bookings Layout -->
      <div class="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-12 anim-in anim-d2">

        <!-- My Lots (Left Column) -->
        <div class="lg:col-span-5 flex flex-col gap-4">
          <div class="flex items-center justify-between px-2">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-warning shadow-[0_0_8px_rgba(251,191,36,0.8)] pulse-dot"></span>
              <h2 class="text-[18px] font-bold text-text-primary m-0 tracking-tight">Assigned Lots</h2>
            </div>
            <span class="text-xs text-text-secondary font-bold uppercase tracking-wider">{{ myLots().length }} Lots</span>
          </div>

          <div class="flex flex-col gap-3">
            @for (lot of myLots(); track lot.lotId) {
              <div class="glass-panel p-5 rounded-2xl cursor-pointer group transition-all duration-300 hover:bg-bg-hover hover:-translate-y-1 relative overflow-hidden"
                   [class.border-accent]="parking.selectedLotId() === lot.lotId"
                   [class.shadow-[0_0_15px_rgba(34,211,238,0.15)]]="parking.selectedLotId() === lot.lotId"
                   (click)="selectLot(lot.lotId)">
                
                <!-- Active Indicator -->
                @if (parking.selectedLotId() === lot.lotId) {
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                  <div class="absolute -right-10 -top-10 w-32 h-32 bg-accent/5 blur-2xl rounded-full"></div>
                }

                <div class="flex items-start justify-between gap-4 mb-4">
                  <div class="min-w-0">
                    <p class="text-[16px] font-extrabold text-text-primary m-0 truncate group-hover:text-accent transition-colors">{{ lot.name }}</p>
                    <p class="text-[13px] text-text-secondary m-0 mt-0.5">{{ lot.city }}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0 relative z-10">
                    <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md"
                          [style.color]="lot.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)'"
                          [style.background]="lot.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'">
                      {{ lot.status }}
                    </span>
                    <button (click)="toggleLot(lot.lotId, $event)"
                            class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/5 text-text-secondary border border-white/5 hover:bg-white/10 hover:text-text-primary hover:border-white/20 transition-all cursor-pointer shadow-inner">
                      Toggle
                    </button>
                  </div>
                </div>

                <!-- Occupancy bar -->
                <div class="flex items-center gap-4">
                  <div class="flex-1 h-2 rounded-full bg-black/40 shadow-inner overflow-hidden relative">
                    <div class="absolute top-0 left-0 bottom-0 rounded-full transition-all duration-700 ease-out"
                         [style.width]="lot.totalSpots ? ((lot.totalSpots - lot.availableSpots) / lot.totalSpots * 100) + '%' : '0%'"
                         [style.background]="occupancyColor(lot)"></div>
                  </div>
                  <span class="text-[12px] text-text-secondary font-bold shrink-0 w-12 text-right">
                    {{ lot.totalSpots - lot.availableSpots }}/{{ lot.totalSpots }}
                  </span>
                </div>
              </div>
            }
            @if (!myLots().length && !loading()) {
              <div class="glass-panel p-10 rounded-3xl text-center flex flex-col items-center justify-center">
                <span class="text-[40px] mb-4 opacity-50">🏢</span>
                <p class="text-text-secondary font-medium m-0">No lots assigned yet</p>
              </div>
            }
          </div>
        </div>

        <!-- Bookings for selected lot (Right Column) -->
        <div class="lg:col-span-7 flex flex-col gap-4">
          <div class="flex items-center justify-between px-2">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(34,211,238,0.8)] pulse-dot"></span>
              <h2 class="text-[18px] font-bold text-text-primary m-0 tracking-tight">Active Operations</h2>
              <span class="text-[14px] text-text-secondary font-medium ml-2">· {{ selectedLotName() }}</span>
            </div>
            <span class="text-xs text-text-secondary font-bold uppercase tracking-wider">{{ lotBookings().length }} Bookings</span>
          </div>

          <div class="glass-panel rounded-3xl overflow-hidden shadow-xl flex flex-col" style="max-height: calc(100vh - 300px); min-height: 400px;">
            <div class="flex-1 overflow-y-auto main-scroll p-2">
              @for (b of lotBookings(); track b.bookingId) {
                <div class="flex items-center gap-4 p-4 rounded-2xl hover:bg-bg-hover/50 border border-transparent hover:border-white/5 transition-all group mb-1">
                  <div class="w-3 h-3 rounded-full shrink-0 shadow-inner" [style.background]="sColor(b.status)"></div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-1">
                      <p class="text-[15px] font-extrabold text-text-primary m-0">Slot {{ b.spotNumber }}</p>
                      <span class="font-mono text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">{{ b.vehiclePlate }}</span>
                    </div>
                    <p class="text-[12px] text-text-secondary m-0 font-medium">{{ b.startTime | date:'MMM d, HH:mm' }}</p>
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
              @if (!lotBookings().length && !loading()) {
                <div class="h-full flex flex-col items-center justify-center p-10 opacity-60">
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1" class="text-text-secondary mb-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-[14px] text-text-secondary m-0 font-medium">No bookings for this lot currently</p>
                </div>
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  parking   = inject(ParkingService);
  private booking   = inject(BookingService);
  public router     = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private destroy$  = new Subject<void>();

  readonly ic = I;
  safe(svg: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(svg); }

  loading     = signal(true);
  myLots      = signal<ParkingLot[]>([]);
  lotBookings = signal<Booking[]>([]);

  selectedLotName = computed(() =>
    this.myLots().find(l => l.lotId === this.parking.selectedLotId())?.name ?? `Lot ${this.parking.selectedLotId()}`
  );

  managerStats = computed(() => {
    const ls     = this.myLots();
    const bs     = this.lotBookings();
    const active = bs.filter(b => b.status === 'CHECKED_IN').length;
    const rev    = bs.reduce((s, b) => s + (b.totalFare ?? 0), 0);
    return [
      { label: 'My Lots',      value: ls.length,                                color: '#1d9bf0', icon: I.building },
      { label: 'Total Spots',  value: ls.reduce((s, l) => s + l.totalSpots, 0), color: '#71767b', icon: I.grid     },
      { label: 'Currently In', value: active,                                   color: '#00ba7c', icon: I.car      },
      { label: 'Lot Revenue',  value: `₹${rev}`,                                color: '#ffd400', icon: I.trending },
    ];
  });

  ngOnInit() {
    this.parking.getManagerLots().pipe(takeUntil(this.destroy$)).subscribe({
      next: lots => {
        this.myLots.set(lots);
        if (lots.length) {
          this.parking.selectedLotId.set(lots[0].lotId);
          this.loadLotBookings(lots[0].lotId);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  private loadLotBookings(lotId: number) {
    this.booking.getBookingsByLot(lotId).pipe(takeUntil(this.destroy$)).subscribe({
      next: bs => this.lotBookings.set(bs), error: () => {}
    });
  }

  selectLot(lotId: number) { this.parking.selectedLotId.set(lotId); this.loadLotBookings(lotId); }

  toggleLot(id: number, e: Event) {
    e.stopPropagation();
    this.parking.toggleLot(id).subscribe(updated => {
      this.myLots.update(ls => ls.map(l => l.lotId === id ? updated : l));
    });
  }

  occupancyColor(lot: ParkingLot): string {
    const pct = lot.totalSpots ? (lot.totalSpots - lot.availableSpots) / lot.totalSpots : 0;
    if (pct >= 0.9) return '#f4212e';
    if (pct >= 0.7) return '#ffd400';
    return '#00ba7c';
  }

  sColor(s: string): string { return SC[s] ?? '#71767b'; }
}
