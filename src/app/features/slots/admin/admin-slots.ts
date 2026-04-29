import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ParkingSpot, ParkingLot, SpotType } from '../../../core/models/parking.models';

@Component({
  selector: 'app-admin-slots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))])]),
    trigger('slotAnim', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(.9)' }),
          stagger(20, [animate('240ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'scale(1)' }))])
        ], { optional: true })
      ])
    ]),
  ],
  template: `
    <div class="p-6 space-y-5 page-host" @fadeUp>

      <!-- Header + tabs -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 style="font-size:22px;font-weight:700;color:var(--text-primary);margin:0;">Parking Management</h2>
          <p style="color:var(--text-secondary);font-size:14px;margin:4px 0 0;">System-wide lot and spot control</p>
        </div>
        <div class="flex rounded-xl p-1" style="background:var(--bg-hover);border:1px solid var(--border);">
          <button (click)="adminTab.set('lots')"
                  class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  [style.background]="adminTab() === 'lots' ? 'var(--bg-card)' : 'transparent'"
                  [style.color]="adminTab() === 'lots' ? 'var(--text-primary)' : 'var(--text-secondary)'"
                  style="border:none;cursor:pointer;">All Lots</button>
          <button (click)="adminTab.set('pending')"
                  class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
                  [style.background]="adminTab() === 'pending' ? 'var(--bg-card)' : 'transparent'"
                  [style.color]="adminTab() === 'pending' ? 'var(--text-primary)' : 'var(--text-secondary)'"
                  style="border:none;cursor:pointer;">
            Pending
            @if (adminPendingLots().length) {
              <span class="px-1.5 py-0.5 rounded-full text-xs font-bold" style="background:#ffd40020;color:#ffd400;">{{ adminPendingLots().length }}</span>
            }
          </button>
          <button (click)="adminTab.set('spots')"
                  class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  [style.background]="adminTab() === 'spots' ? 'var(--bg-card)' : 'transparent'"
                  [style.color]="adminTab() === 'spots' ? 'var(--text-primary)' : 'var(--text-secondary)'"
                  style="border:none;cursor:pointer;">Spots</button>
          <button (click)="adminTab.set('revenue'); loadAdminRevenue()"
                  class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  [style.background]="adminTab() === 'revenue' ? 'var(--bg-card)' : 'transparent'"
                  [style.color]="adminTab() === 'revenue' ? 'var(--text-primary)' : 'var(--text-secondary)'"
                  style="border:none;cursor:pointer;">Revenue</button>
        </div>
      </div>

      <!-- ALL LOTS TAB -->
      @if (adminTab() === 'lots') {
        <div class="grid gap-4" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));" @fadeUp>
          @for (lot of allLots(); track lot.lotId) {
            <div class="card p-5"
                 style="transition:transform 200ms ease,box-shadow 200ms ease;"
                 onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,.12)'"
                 onmouseleave="this.style.transform='';this.style.boxShadow=''">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <p style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0;">{{ lot.name }}</p>
                  <p style="font-size:12px;color:var(--text-secondary);margin:2px 0 0;">{{ lot.address }}, {{ lot.city }}</p>
                </div>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                      [style.background]="lotStatusBg(lot.status)"
                      [style.color]="lotStatusColor(lot.status)">{{ lot.status }}</span>
              </div>
              <div class="flex items-center justify-between mt-4">
                <span style="font-size:12px;color:var(--text-secondary);">
                  {{ lot.availableSpots }}/{{ lot.totalSpots }} available · {{ lot.openingTime }}–{{ lot.closingTime }}
                </span>
                <button (click)="adminViewSpots(lot.lotId)"
                        class="text-xs px-3 py-1.5 rounded-full font-semibold"
                        style="background:var(--accent-dim);color:var(--accent);border:1px solid rgba(29,155,240,.2);cursor:pointer;">
                  View Spots
                </button>
              </div>
            </div>
          }
        </div>
        @if (!allLots().length) {
          <div class="card p-12 flex flex-col items-center text-center" @fadeUp>
            <p style="font-size:15px;color:var(--text-secondary);">No lots registered yet.</p>
          </div>
        }
      }

      <!-- PENDING TAB -->
      @if (adminTab() === 'pending') {
        @if (!adminPendingLots().length) {
          <div class="card p-16 flex flex-col items-center text-center" @fadeUp>
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.5" class="mb-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p style="font-size:15px;font-weight:600;color:var(--text-primary);margin:0 0 4px;">All caught up</p>
            <p style="font-size:13px;color:var(--text-secondary);margin:0;">No lots pending approval.</p>
          </div>
        } @else {
          <div class="space-y-3" @fadeUp>
            @for (lot of adminPendingLots(); track lot.lotId) {
              <div class="card p-5">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <p style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0;">{{ lot.name }}</p>
                    <p style="font-size:12px;color:var(--text-secondary);margin:2px 0 0;">{{ lot.address }}, {{ lot.city }}</p>
                    <p style="font-size:12px;color:var(--text-secondary);margin:2px 0 0;">
                      Opens {{ lot.openingTime }} – Closes {{ lot.closingTime }}
                    </p>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                        style="background:rgba(255,212,0,.15);color:#ffd400;">PENDING</span>
                </div>
                <div class="flex gap-3 mt-4">
                  <button (click)="adminApproveLot(lot.lotId)"
                          class="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                          style="background:rgba(0,186,124,.1);color:#00ba7c;border:1px solid rgba(0,186,124,.25);cursor:pointer;">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                    Approve
                  </button>
                  <button (click)="adminRejectLot(lot.lotId)"
                          class="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                          style="background:rgba(244,33,46,.08);color:#f4212e;border:1px solid rgba(244,33,46,.2);cursor:pointer;">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    Reject
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- SPOTS TAB -->
      @if (adminTab() === 'spots') {
        <div class="flex flex-wrap gap-3 items-center">
          <select [(ngModel)]="adminLotId" (ngModelChange)="onAdminLotChange()"
                  class="px-3 py-2 rounded-xl text-sm"
                  style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);outline:none;">
            @for (lot of allLots(); track lot.lotId) {
              <option [value]="lot.lotId">{{ lot.name }}</option>
            }
          </select>
          <div class="flex gap-3 ml-auto flex-wrap">
            @for (leg of legend; track leg.label) {
              <div class="flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full" [style.background]="leg.color"></div>
                <span style="font-size:12px;color:var(--text-secondary);">{{ leg.label }}</span>
              </div>
            }
          </div>
        </div>

        @if (loadingSpots()) {
          <div class="grid gap-2" style="grid-template-columns:repeat(auto-fill,minmax(90px,1fr));">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="rounded-2xl animate-pulse" style="height:90px;background:var(--bg-card);"></div>
            }
          </div>
        } @else if (!allSpots().length) {
          <div class="card p-12 flex flex-col items-center text-center" @fadeUp>
            <p style="font-size:15px;color:var(--text-secondary);">No spots found for this lot.</p>
          </div>
        } @else {
          <div class="grid gap-2" [@slotAnim]="allSpots().length"
               style="grid-template-columns:repeat(auto-fill,minmax(100px,1fr));">
            @for (spot of allSpots(); track spot.spotId) {
              <div class="flex flex-col items-center justify-between rounded-2xl border-2 p-2"
                   style="min-height:100px;"
                   [class.slot-available]="spot.status === 'AVAILABLE'"
                   [class.slot-reserved]="spot.status === 'RESERVED'"
                   [class.slot-occupied]="spot.status === 'OCCUPIED'">
                <div class="flex flex-col items-center flex-1 justify-center">
                  <span style="font-size:13px;font-weight:700;">{{ spot.spotNumber }}</span>
                  <span style="font-size:10px;opacity:.75;">F{{ spot.floor }}</span>
                  <span style="font-size:9px;opacity:.6;">{{ spot.spotType | slice:0:3 }}</span>
                  <span style="font-size:9px;font-weight:600;">&#8377;{{ spot.pricePerHour }}/h</span>
                </div>
                <button (click)="adminForceRemoveSpot(spot.spotId)"
                        style="background:rgba(244,33,46,.12);border:none;cursor:pointer;border-radius:6px;padding:2px 8px;color:#f4212e;font-size:10px;font-weight:600;margin-top:4px;">
                  Remove
                </button>
              </div>
            }
          </div>
        }
      <!-- REVENUE TAB -->
      @if (adminTab() === 'revenue') {
        <div class="space-y-4" @fadeUp>
          <!-- All-time platform revenue card -->
          @if (adminRevenueLoading()) {
            <div class="card p-6 animate-pulse" style="height:100px;"></div>
          } @else if (adminAllTimeRevenue()) {
            <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));" @fadeIn>
              <div class="card p-5">
                <p style="font-size:11px;color:var(--text-secondary);margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">All-Time Revenue</p>
                <p style="font-size:32px;font-weight:900;color:var(--accent);margin:0;">₹{{ adminAllTimeRevenue()?.totalRevenue | number:'1.0-0' }}</p>
                <p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0;">{{ adminAllTimeRevenue()?.totalTransactions }} transactions</p>
              </div>
              <div class="card p-5">
                <p style="font-size:11px;color:var(--text-secondary);margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Avg per Transaction</p>
                <p style="font-size:32px;font-weight:900;color:#00ba7c;margin:0;">
                  ₹{{ adminAllTimeRevenue()?.totalTransactions ? ((adminAllTimeRevenue()?.totalRevenue ?? 0) / (adminAllTimeRevenue()?.totalTransactions ?? 1) | number:'1.0-0') : 0 }}
                </p>
                <p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0;">platform average</p>
              </div>
            </div>
          }

          <!-- Date-range platform revenue -->
          <div class="card p-5">
            <p style="font-size:14px;font-weight:600;color:var(--text-primary);margin:0 0 12px;">Revenue by Date Range</p>
            <div class="flex flex-wrap gap-3 items-end">
              <div>
                <p style="font-size:11px;color:var(--text-secondary);margin:0 0 4px;">From</p>
                <input [(ngModel)]="adminRevFrom" type="date"
                       class="px-3 py-2 rounded-xl text-sm"
                       style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;"/>
              </div>
              <div>
                <p style="font-size:11px;color:var(--text-secondary);margin:0 0 4px;">To</p>
                <input [(ngModel)]="adminRevTo" type="date"
                       class="px-3 py-2 rounded-xl text-sm"
                       style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;"/>
              </div>
              <button (click)="loadPlatformRevenue()" [disabled]="adminRevenueLoading()"
                      class="px-4 py-2 rounded-xl text-sm font-bold"
                      style="background:var(--accent);color:#fff;border:none;cursor:pointer;"
                      [style.opacity]="adminRevenueLoading() ? '.6' : '1'">
                Fetch
              </button>
            </div>
            @if (adminPlatformRevenue()) {
              <div class="mt-4 grid gap-3" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));" @fadeIn>
                <div class="rounded-xl p-4" style="background:var(--bg-secondary);">
                  <p style="font-size:11px;color:var(--text-secondary);margin:0 0 4px;">Revenue</p>
                  <p style="font-size:22px;font-weight:800;color:var(--accent);margin:0;">₹{{ adminPlatformRevenue()?.totalRevenue | number:'1.0-0' }}</p>
                </div>
                <div class="rounded-xl p-4" style="background:var(--bg-secondary);">
                  <p style="font-size:11px;color:var(--text-secondary);margin:0 0 4px;">Transactions</p>
                  <p style="font-size:22px;font-weight:800;color:#00ba7c;margin:0;">{{ adminPlatformRevenue()?.totalTransactions }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Per-lot revenue lookup -->
          <div class="card p-5">
            <p style="font-size:14px;font-weight:600;color:var(--text-primary);margin:0 0 12px;">Revenue by Lot</p>
            <div class="flex gap-3 flex-wrap items-end">
              <select [(ngModel)]="adminRevLotId"
                      class="px-3 py-2 rounded-xl text-sm"
                      style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;min-width:200px;">
                @for (lot of allLots(); track lot.lotId) {
                  <option [value]="lot.lotId">{{ lot.name }} — {{ lot.city }}</option>
                }
              </select>
              <button (click)="loadLotRevenue()" [disabled]="adminRevenueLoading()"
                      class="px-4 py-2 rounded-xl text-sm font-bold"
                      style="background:var(--accent);color:#fff;border:none;cursor:pointer;"
                      [style.opacity]="adminRevenueLoading() ? '.6' : '1'">
                Fetch
              </button>
            </div>
            @if (adminLotRevenue()) {
              <div class="mt-4 grid gap-3" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));" @fadeIn>
                <div class="rounded-xl p-4" style="background:var(--bg-secondary);">
                  <p style="font-size:11px;color:var(--text-secondary);margin:0 0 4px;">Revenue</p>
                  <p style="font-size:22px;font-weight:800;color:var(--accent);margin:0;">₹{{ adminLotRevenue()?.totalRevenue | number:'1.0-0' }}</p>
                </div>
                <div class="rounded-xl p-4" style="background:var(--bg-secondary);">
                  <p style="font-size:11px;color:var(--text-secondary);margin:0 0 4px;">Transactions</p>
                  <p style="font-size:22px;font-weight:800;color:#00ba7c;margin:0;">{{ adminLotRevenue()?.totalTransactions }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      }
    }

    </div>
  `,
  styles: [`
    .animate-pulse { animation: pulse 1.5s cubic-bezier(.4,0,.6,1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
  `]
})
export class AdminSlotsComponent implements OnInit, OnDestroy {
  private parking  = inject(ParkingService);
  private auth     = inject(AuthService);
  private paySvc   = inject(PaymentService);
  private destroy$ = new Subject<void>();

  allLots      = signal<ParkingLot[]>([]);
  allSpots     = signal<ParkingSpot[]>([]);
  adminPendingLots  = signal<ParkingLot[]>([]);
  adminTab = signal<'lots' | 'pending' | 'spots' | 'revenue'>('lots');
  adminLotId = 1;
  adminRevFrom        = '';
  adminRevTo          = '';
  adminRevLotId       = 0;
  adminRevenueLoading = signal(false);
  adminAllTimeRevenue = signal<any>(null);
  adminPlatformRevenue = signal<any>(null);
  adminLotRevenue     = signal<any>(null);
  loadingSpots = signal(true);
  loadingLots  = signal(true);

  spotTypes: SpotType[] = ['STANDARD','COMPACT','LARGE','EV_ONLY','HANDICAPPED'];
  legend = [
    { label: 'Available', color: '#00ba7c' },
    { label: 'Reserved',  color: '#ffd400' },
    { label: 'Occupied',  color: '#f4212e' },
  ];

  ngOnInit() {
    forkJoin({
      lots:    this.parking.getLots(),
      pending: this.parking.getPendingLots(),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ lots, pending }) => {
        this.allLots.set(lots);
        this.adminPendingLots.set(pending);
        this.loadingLots.set(false);
        if (lots.length) { this.adminLotId = lots[0].lotId; this.loadAdminSpots(); }
        else this.loadingSpots.set(false);
        if (pending.length) this.adminTab.set('pending');
      },
      error: () => { this.loadingLots.set(false); this.loadingSpots.set(false); }
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  loadAdminSpots() {
    this.loadingSpots.set(true);
    this.parking.getSpots(this.adminLotId).pipe(takeUntil(this.destroy$)).subscribe({
      next: spots => { this.allSpots.set(spots); this.loadingSpots.set(false); },
      error: () => this.loadingSpots.set(false)
    });
  }

  onAdminLotChange() { this.loadAdminSpots(); }

  adminViewSpots(lotId: number) {
    this.adminLotId = lotId;
    this.adminTab.set('spots');
    this.loadAdminSpots();
  }

  adminApproveLot(id: number) {
    this.parking.approveLot(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.adminPendingLots.update(ls => ls.filter(l => l.lotId !== id));
        this.parking.getLots().subscribe(lots => this.allLots.set(lots));
      }
    });
  }

  adminRejectLot(id: number) {
    this.parking.rejectLot(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.adminPendingLots.update(ls => ls.filter(l => l.lotId !== id))
    });
  }

  adminForceRemoveSpot(spotId: number) {
    this.parking.deleteSpot(spotId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.allSpots.update(s => s.filter(x => x.spotId !== spotId))
    });
  }

  loadAdminRevenue() {
    this.adminRevenueLoading.set(true);
    this.paySvc.getAllTimeRevenue().pipe(takeUntil(this.destroy$)).subscribe({
      next: r => { this.adminAllTimeRevenue.set(r); this.adminRevenueLoading.set(false); },
      error: () => this.adminRevenueLoading.set(false)
    });
    if (this.allLots().length) this.adminRevLotId = this.allLots()[0].lotId;
  }

  loadPlatformRevenue() {
    if (!this.adminRevFrom || !this.adminRevTo) return;
    this.adminRevenueLoading.set(true);
    this.paySvc.getPlatformRevenue(this.adminRevFrom, this.adminRevTo).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => { this.adminPlatformRevenue.set(r); this.adminRevenueLoading.set(false); },
      error: () => this.adminRevenueLoading.set(false)
    });
  }

  loadLotRevenue() {
    if (!this.adminRevLotId) return;
    this.adminRevenueLoading.set(true);
    this.paySvc.getLotRevenue(this.adminRevLotId).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => { this.adminLotRevenue.set(r); this.adminRevenueLoading.set(false); },
      error: () => this.adminRevenueLoading.set(false)
    });
  }

  lotStatusColor(s: string) { return s === 'APPROVED' || s === 'ACTIVE' ? '#00ba7c' : s === 'PENDING' ? '#ffd400' : '#f4212e'; }
  lotStatusBg(s: string) { return s === 'APPROVED' || s === 'ACTIVE' ? 'rgba(0,186,124,.12)' : s === 'PENDING' ? 'rgba(255,212,0,.12)' : 'rgba(244,33,46,.12)'; }
}
