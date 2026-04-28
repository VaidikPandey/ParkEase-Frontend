import { Component, OnDestroy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { ParkingLot, Vehicle, Booking } from '../../../core/models/parking.models';
import { DriverSpotGridComponent } from './driver-spot-grid';

@Component({
  selector: 'app-driver-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, DriverSpotGridComponent],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))])]),
  ],
  template: `
    <!-- City search row -->
    <div class="flex flex-wrap gap-2 items-center">
      <div class="flex gap-2 items-center">
        <input [(ngModel)]="citySearch" type="text" placeholder="Filter by city…"
               (keyup.enter)="searchByCity()"
               class="px-3 py-2 rounded-xl text-sm"
               style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);outline:none;width:160px;"/>
        <button (click)="searchByCity()" [disabled]="citySearching()"
                class="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
                style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;"
                [style.opacity]="citySearching() ? '.6' : '1'">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>
          </svg>
          Search
        </button>
        @if (citySearch) {
          <button (click)="citySearch=''; searchByCity()"
                  style="background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:0 4px;">✕</button>
        }
      </div>
    </div>

    <!-- Lot cards — shown when no lot is selected -->
    @if (!selectedLotId()) {
      @if (visibleLots().length === 0 && !loadingLots()) {
        <p style="font-size:14px;color:var(--text-secondary);">No lots found.</p>
      }
      <div class="grid gap-3 mt-1" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));">
        @for (lot of visibleLots(); track lot.lotId) {
          <div class="card p-4 cursor-pointer transition-all"
               style="border:1.5px solid var(--border);"
               onmouseenter="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)'"
               onmouseleave="this.style.borderColor='var(--border)';this.style.transform=''"
               (click)="selectedLotId.set(lot.lotId)">
            <div class="flex items-start justify-between mb-2">
              <div>
                <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">{{ lot.name }}</p>
                <p style="font-size:12px;color:var(--text-secondary);margin:2px 0 0;">{{ lot.address }}, {{ lot.city }}</p>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                    style="background:rgba(0,186,124,.1);color:#00ba7c;">{{ lot.status }}</span>
            </div>
            <div class="flex items-center justify-between mt-3">
              <span style="font-size:12px;color:var(--text-secondary);">{{ lot.openingTime }} – {{ lot.closingTime }}</span>
              <span style="font-size:12px;font-weight:600;color:var(--accent);">View spots →</span>
            </div>
          </div>
        }
      </div>
    } @else {
      <!-- Back + lot name breadcrumb -->
      <div class="flex items-center gap-3">
        <button (click)="selectedLotId.set(null)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
          All Lots
        </button>
        <span style="font-size:14px;font-weight:600;color:var(--text-primary);">{{ activeLot()?.name }}</span>
        <span style="font-size:12px;color:var(--text-secondary);">{{ activeLot()?.city }}</span>
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
