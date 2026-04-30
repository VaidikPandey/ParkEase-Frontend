import { Component, OnDestroy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { ParkingLot, Vehicle, Booking } from '../../../core/models/parking.models';
import { DriverSpotGridComponent } from './driver-spot-grid';

@Component({
  selector: 'app-driver-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, DriverSpotGridComponent],
  template: `
    <!-- City search -->
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
      <div style="position:relative;">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#71767b" stroke-width="2"
             style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"/>
        </svg>
        <input [(ngModel)]="citySearch" type="text" placeholder="Filter by city…"
               (keyup.enter)="searchByCity()"
               style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:9px 14px 9px 34px;font-size:13px;color:#e7e9ea;outline:none;width:180px;transition:border-color 150ms;"
               onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
      </div>
      <button (click)="searchByCity()" [disabled]="citySearching()"
              style="padding:9px 16px;border-radius:10px;font-size:13px;font-weight:600;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#71767b;cursor:pointer;transition:opacity 150ms;"
              [style.opacity]="citySearching() ? '.5' : '1'">
        Search
      </button>
      @if (citySearch) {
        <button (click)="citySearch=''; searchByCity()"
                style="background:none;border:none;cursor:pointer;color:#71767b;font-size:15px;padding:0 4px;line-height:1;">✕</button>
      }
    </div>

    <!-- Lot list (no lot selected) -->
    @if (!selectedLotId()) {
      @if (visibleLots().length === 0 && !loadingLots()) {
        <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:48px 24px;text-align:center;">
          <p style="font-size:14px;color:#71767b;margin:0;">No lots found in that city.</p>
        </div>
      }
      <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;">
        @for (lot of visibleLots(); track lot.lotId; let last = $last) {
          <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;cursor:pointer;transition:background 120ms ease;"
               [style.border-bottom]="last ? 'none' : '1px solid rgba(255,255,255,.04)'"
               onmouseenter="this.style.background='rgba(255,255,255,.03)'"
               onmouseleave="this.style.background='transparent'"
               (click)="selectedLotId.set(lot.lotId)">
            <!-- Icon -->
            <div style="width:40px;height:40px;border-radius:10px;background:rgba(29,155,240,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/>
              </svg>
            </div>
            <!-- Info -->
            <div style="flex:1;min-width:0;">
              <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0 0 2px;">{{ lot.name }}</p>
              <p style="font-size:12px;color:#71767b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ lot.address }}, {{ lot.city }}</p>
            </div>
            <!-- Meta -->
            <div style="text-align:right;flex-shrink:0;">
              <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;background:rgba(0,186,124,.12);color:#00ba7c;display:block;margin-bottom:4px;letter-spacing:.05em;text-transform:uppercase;">{{ lot.status }}</span>
              <span style="font-size:11px;color:#536471;">{{ lot.openingTime }} – {{ lot.closingTime }}</span>
            </div>
            <!-- Arrow -->
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#71767b" stroke-width="2" style="flex-shrink:0;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
            </svg>
          </div>
        }
      </div>
    } @else {
      <!-- Back + breadcrumb -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <button (click)="selectedLotId.set(null)"
                style="display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;font-size:13px;font-weight:600;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#71767b;cursor:pointer;transition:opacity 150ms;"
                onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
          All Lots
        </button>
        <span style="font-size:14px;font-weight:700;color:#e7e9ea;">{{ activeLot()?.name }}</span>
        <span style="font-size:12px;color:#71767b;">{{ activeLot()?.city }}</span>
      </div>

      <!-- Spot grid -->
      <app-driver-spot-grid
        [lotId]="selectedLotId()!"
        [vehicles]="vehicles()"
        (bookingConfirmed)="bookingConfirmed.emit($event)" />
    }
  `
})
export class DriverBrowseComponent implements OnDestroy {
  allLots     = input<ParkingLot[]>([]);
  loadingLots = input<boolean>(false);
  vehicles    = input<Vehicle[]>([]);
  bookingConfirmed = output<{ booking: Booking; cost: number }>();

  private parking  = inject(ParkingService);
  private destroy$ = new Subject<void>();

  selectedLotId  = signal<number | null>(null);
  citySearch     = '';
  citySearching  = signal(false);
  filteredLots   = signal<ParkingLot[] | null>(null);

  activeLot   = computed(() => this.allLots().find(l => l.lotId === this.selectedLotId()) ?? null);
  visibleLots = computed(() => this.filteredLots() ?? this.allLots());

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  searchByCity() {
    this.citySearching.set(true);
    this.selectedLotId.set(null);
    this.parking.getApprovedLots(this.citySearch.trim() || undefined)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: lots => { this.filteredLots.set(lots); this.citySearching.set(false); },
        error: () => this.citySearching.set(false)
      });
  }
}
