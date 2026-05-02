import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ParkingSpot, ParkingLot } from '../../../core/models/parking.models';
import { ThemeSelectComponent, ThemeSelectOption } from '../../../shared/components/theme-select/theme-select';

const spotStatusColor: Record<string, string> = { AVAILABLE: '#00ba7c', RESERVED: '#ffd400', OCCUPIED: '#f4212e' };
const spotStatusBg:    Record<string, string> = { AVAILABLE: 'rgba(0,186,124,.12)', RESERVED: 'rgba(255,212,0,.1)', OCCUPIED: 'rgba(244,33,46,.1)' };

@Component({
  selector: 'app-admin-slots',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemeSelectComponent],
  template: `
    <div style="max-width:1100px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header + tabs -->
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <h1 style="font-size:22px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.3px;">Parking Management</h1>
          <p style="font-size:13px;color:#71767b;margin:0;">System-wide lot and spot control</p>
        </div>
        <div style="display:flex;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:4px;gap:4px;flex-wrap:wrap;">
          @for (tab of adminTabs; track tab.id) {
            <button (click)="switchAdminTab(tab.id)"
                    style="padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all 150ms;display:flex;align-items:center;gap:6px;"
                    [style.background]="adminTab() === tab.id ? 'rgba(255,255,255,.08)' : 'transparent'"
                    [style.color]="adminTab() === tab.id ? '#e7e9ea' : '#71767b'">
              {{ tab.label }}
              @if (tab.id === 'pending' && adminPendingLots().length) {
                <span style="padding:1px 6px;border-radius:9999px;font-size:10px;font-weight:700;background:rgba(255,212,0,.15);color:#ffd400;">{{ adminPendingLots().length }}</span>
              }
            </button>
          }
        </div>
      </div>

      <!-- ALL LOTS TAB -->
      @if (adminTab() === 'lots') {
        @if (!allLots().length) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:56px 24px;text-align:center;">
            <p style="font-size:14px;color:#71767b;margin:0;">No lots registered yet.</p>
          </div>
        } @else {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">
            @for (lot of allLots(); track lot.lotId; let last = $last) {
              <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;transition:background 120ms ease;"
                   [style.border-bottom]="last ? 'none' : '1px solid rgba(255,255,255,.04)'"
                   onmouseenter="this.style.background='rgba(255,255,255,.03)'"
                   onmouseleave="this.style.background='transparent'">
                <div style="width:40px;height:40px;border-radius:10px;background:rgba(29,155,240,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/>
                  </svg>
                </div>
                <div style="flex:1;min-width:0;">
                  <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ lot.name }}</p>
                  <p style="font-size:12px;color:#71767b;margin:0;">{{ lot.address }}, {{ lot.city }} · {{ lot.availableSpots }}/{{ lot.totalSpots }} avail · {{ lot.openingTime }}–{{ lot.closingTime }}</p>
                </div>
                <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:.06em;text-transform:uppercase;flex-shrink:0;"
                      [style.background]="lotStatusBg(lot.status)" [style.color]="lotStatusColor(lot.status)">{{ lot.status }}</span>
                <button (click)="adminViewSpots(lot.lotId)"
                        style="font-size:12px;padding:6px 12px;border-radius:9999px;font-weight:600;background:rgba(29,155,240,.1);color:#1d9bf0;border:none;cursor:pointer;transition:opacity 150ms;flex-shrink:0;"
                        onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">
                  View Spots
                </button>
              </div>
            }
          </div>
        }
      }

      <!-- PENDING TAB -->
      @if (adminTab() === 'pending') {
        @if (!adminPendingLots().length) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:64px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;" class="anim-in anim-d1">
            <div style="width:52px;height:52px;border-radius:50%;background:rgba(0,186,124,.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#00ba7c" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p style="font-size:15px;font-weight:700;color:#e7e9ea;margin:0 0 6px;">All caught up</p>
            <p style="font-size:13px;color:#71767b;margin:0;">No lots pending approval.</p>
          </div>
        } @else {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">
            @for (lot of adminPendingLots(); track lot.lotId; let last = $last) {
              <div style="display:flex;align-items:center;gap:14px;padding:16px 20px;transition:background 120ms ease;"
                   [style.border-bottom]="last ? 'none' : '1px solid rgba(255,255,255,.04)'"
                   onmouseenter="this.style.background='rgba(255,255,255,.03)'"
                   onmouseleave="this.style.background='transparent'">
                <div style="flex:1;min-width:0;">
                  <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0 0 2px;">{{ lot.name }}</p>
                  <p style="font-size:12px;color:#71767b;margin:0;">{{ lot.address }}, {{ lot.city }} · {{ lot.openingTime }} – {{ lot.closingTime }}</p>
                </div>
                <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;background:rgba(255,212,0,.12);color:#ffd400;letter-spacing:.06em;flex-shrink:0;">PENDING</span>
                <div style="display:flex;gap:8px;flex-shrink:0;">
                  <button (click)="adminApproveLot(lot.lotId)"
                          style="font-size:12px;padding:7px 14px;border-radius:9999px;font-weight:600;background:rgba(0,186,124,.1);color:#00ba7c;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;transition:opacity 150ms;"
                          onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                    Approve
                  </button>
                  <button (click)="adminRejectLot(lot.lotId)"
                          style="font-size:12px;padding:7px 14px;border-radius:9999px;font-weight:600;background:rgba(244,33,46,.08);color:#f4212e;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;transition:opacity 150ms;"
                          onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
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
        <div style="display:flex;align-items:flex-end;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
          <app-theme-select
            label="Select Lot"
            placeholder="Choose a lot"
            width="280px"
            [searchable]="true"
            [options]="adminLotOptions()"
            [value]="adminLotId ? adminLotId.toString() : ''"
            [allowClear]="false"
            (valueChange)="selectAdminLot($event)" />
          <div style="margin-left:auto;display:flex;gap:14px;">
            @for (leg of legend; track leg.label) {
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:8px;height:8px;border-radius:50%;" [style.background]="leg.color"></div>
                <span style="font-size:12px;color:#71767b;">{{ leg.label }}</span>
              </div>
            }
          </div>
        </div>

        @if (loadingSpots()) {
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div style="background:rgba(255,255,255,.025);border-radius:12px;height:90px;animation:pulse 1.5s ease-in-out infinite;"></div>
            }
          </div>
        } @else if (!allSpots().length) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:56px 24px;text-align:center;">
            <p style="font-size:14px;color:#71767b;margin:0;">No spots found for this lot.</p>
          </div>
        } @else {
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;">
            @for (spot of allSpots(); track spot.spotId) {
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:space-between;border-radius:12px;border:1.5px solid;padding:10px 6px;min-height:100px;"
                   [style.background]="spotStatusBg[spot.status]"
                   [style.border-color]="spotStatusColor[spot.status]">
                <div style="display:flex;flex-direction:column;align-items:center;flex:1;justify-content:center;gap:2px;">
                  <span style="font-size:13px;font-weight:700;" [style.color]="spotStatusColor[spot.status]">{{ spot.spotNumber }}</span>
                  <span style="font-size:10px;color:#71767b;">F{{ spot.floor }}</span>
                  <span style="font-size:9px;color:#536471;">{{ spot.spotType | slice:0:3 }}</span>
                  <span style="font-size:9px;font-weight:600;color:#71767b;">₹{{ spot.pricePerHour }}/h</span>
                </div>
                <button (click)="adminForceRemoveSpot(spot.spotId)"
                        style="background:rgba(244,33,46,.1);border:none;cursor:pointer;border-radius:6px;padding:2px 8px;color:#f4212e;font-size:10px;font-weight:600;margin-top:6px;transition:opacity 150ms;"
                        onmouseenter="this.style.opacity='.7'" onmouseleave="this.style.opacity='1'">
                  Remove
                </button>
              </div>
            }
          </div>
        }
      }

      <!-- REVENUE TAB -->
      @if (adminTab() === 'revenue') {
        <div style="display:flex;flex-direction:column;gap:16px;" class="anim-in anim-d1">

          <!-- All-time revenue -->
          @if (adminRevenueLoading()) {
            <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;height:100px;animation:pulse 1.5s ease-in-out infinite;"></div>
          } @else if (adminAllTimeRevenue()) {
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
              <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:18px 20px;display:flex;align-items:center;gap:14px;">
                <div style="width:44px;height:44px;border-radius:12px;background:rgba(29,155,240,.12);color:#1d9bf0;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p style="font-size:26px;font-weight:800;color:#1d9bf0;letter-spacing:-1px;margin:0;">₹{{ adminAllTimeRevenue()?.totalRevenue | number:'1.0-0' }}</p>
                  <p style="font-size:12px;color:#71767b;margin:3px 0 0;">All-Time Revenue</p>
                  <p style="font-size:11px;color:#536471;margin:2px 0 0;">{{ adminAllTimeRevenue()?.totalTransactions }} transactions</p>
                </div>
              </div>
              <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:18px 20px;display:flex;align-items:center;gap:14px;">
                <div style="width:44px;height:44px;border-radius:12px;background:rgba(0,186,124,.1);color:#00ba7c;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"/></svg>
                </div>
                <div>
                  <p style="font-size:26px;font-weight:800;color:#00ba7c;letter-spacing:-1px;margin:0;">₹{{ adminAllTimeRevenue()?.totalTransactions ? ((adminAllTimeRevenue()?.totalRevenue ?? 0) / (adminAllTimeRevenue()?.totalTransactions ?? 1) | number:'1.0-0') : 0 }}</p>
                  <p style="font-size:12px;color:#71767b;margin:3px 0 0;">Avg per Transaction</p>
                  <p style="font-size:11px;color:#536471;margin:2px 0 0;">platform average</p>
                </div>
              </div>
            </div>
          }

          <!-- Date range revenue -->
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;">
            <div style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
              <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">Revenue by Date Range</p>
            </div>
            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px;">
              <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
                <div>
                  <label style="display:block;font-size:11px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">From</label>
                  <input [(ngModel)]="adminRevFrom" type="date"
                         style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:9px 12px;font-size:13px;color:#e7e9ea;outline:none;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:11px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">To</label>
                  <input [(ngModel)]="adminRevTo" type="date"
                         style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:9px 12px;font-size:13px;color:#e7e9ea;outline:none;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <button (click)="loadPlatformRevenue()" [disabled]="adminRevenueLoading()"
                        style="padding:9px 18px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                        [style.opacity]="adminRevenueLoading() ? '.5' : '1'">Fetch</button>
              </div>
              @if (adminPlatformRevenue()) {
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">
                  <div style="background:rgba(255,255,255,.03);border-radius:12px;padding:14px 16px;">
                    <p style="font-size:11px;color:#71767b;margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em;">Revenue</p>
                    <p style="font-size:22px;font-weight:800;color:#1d9bf0;margin:0;">₹{{ adminPlatformRevenue()?.totalRevenue | number:'1.0-0' }}</p>
                  </div>
                  <div style="background:rgba(255,255,255,.03);border-radius:12px;padding:14px 16px;">
                    <p style="font-size:11px;color:#71767b;margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em;">Transactions</p>
                    <p style="font-size:22px;font-weight:800;color:#00ba7c;margin:0;">{{ adminPlatformRevenue()?.totalTransactions }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Per-lot revenue -->
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;">
            <div style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
              <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">Revenue by Lot</p>
            </div>
            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px;">
              <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
                <app-theme-select
                  label="Lot"
                  placeholder="Choose a lot"
                  width="280px"
                  [searchable]="true"
                  [options]="adminLotOptions()"
                  [value]="adminRevLotId ? adminRevLotId.toString() : ''"
                  [allowClear]="false"
                  (valueChange)="adminRevLotId = +$event" />
                <button (click)="loadLotRevenue()" [disabled]="adminRevenueLoading()"
                        style="padding:9px 18px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                        [style.opacity]="adminRevenueLoading() ? '.5' : '1'">Fetch</button>
              </div>
              @if (adminLotRevenue()) {
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">
                  <div style="background:rgba(255,255,255,.03);border-radius:12px;padding:14px 16px;">
                    <p style="font-size:11px;color:#71767b;margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em;">Revenue</p>
                    <p style="font-size:22px;font-weight:800;color:#1d9bf0;margin:0;">₹{{ adminLotRevenue()?.totalRevenue | number:'1.0-0' }}</p>
                  </div>
                  <div style="background:rgba(255,255,255,.03);border-radius:12px;padding:14px 16px;">
                    <p style="font-size:11px;color:#71767b;margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em;">Transactions</p>
                    <p style="font-size:22px;font-weight:800;color:#00ba7c;margin:0;">{{ adminLotRevenue()?.totalTransactions }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class AdminSlotsComponent implements OnInit, OnDestroy {
  private parking  = inject(ParkingService);
  private paySvc   = inject(PaymentService);
  private destroy$ = new Subject<void>();

  readonly spotStatusColor = spotStatusColor;
  readonly spotStatusBg    = spotStatusBg;

  allLots           = signal<ParkingLot[]>([]);
  allSpots          = signal<ParkingSpot[]>([]);
  adminPendingLots  = signal<ParkingLot[]>([]);
  adminTab = signal<'lots' | 'pending' | 'spots' | 'revenue'>('lots');
  adminLotId = 1;
  adminRevFrom         = '';
  adminRevTo           = '';
  adminRevLotId        = 0;
  adminRevenueLoading  = signal(false);
  adminAllTimeRevenue  = signal<any>(null);
  adminPlatformRevenue = signal<any>(null);
  adminLotRevenue      = signal<any>(null);
  loadingSpots = signal(true);
  loadingLots  = signal(true);

  adminTabs = [
    { id: 'lots'    as const, label: 'All Lots' },
    { id: 'pending' as const, label: 'Pending' },
    { id: 'spots'   as const, label: 'Spots' },
    { id: 'revenue' as const, label: 'Revenue' },
  ];

  adminLotOptions = computed<ThemeSelectOption[]>(() =>
    this.allLots().map(lot => ({
      label: lot.name,
      value: String(lot.lotId),
      meta: `${lot.city} · ${lot.status}`,
    }))
  );
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

  selectAdminLot(lotId: string) {
    this.adminLotId = +lotId;
    this.loadAdminSpots();
  }

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

  switchAdminTab(id: 'lots' | 'pending' | 'spots' | 'revenue') {
    this.adminTab.set(id);
    if (id === 'revenue') this.loadAdminRevenue();
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
  lotStatusBg(s: string)    { return s === 'APPROVED' || s === 'ACTIVE' ? 'rgba(0,186,124,.12)' : s === 'PENDING' ? 'rgba(255,212,0,.12)' : 'rgba(244,33,46,.12)'; }
}
