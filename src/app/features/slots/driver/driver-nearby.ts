import { Component, OnDestroy, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { ParkingLot, Vehicle, Booking } from '../../../core/models/parking.models';
import { DriverSpotGridComponent } from './driver-spot-grid';

@Component({
  selector: 'app-driver-nearby',
  standalone: true,
  imports: [CommonModule, FormsModule, DriverSpotGridComponent],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))])]),
    trigger('fadeUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(16px)' }), animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  template: `
    <!-- Search bar -->
    <div class="card p-5" @fadeIn>
      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <p style="font-size:11px;color:var(--text-secondary);margin:0 0 5px;text-transform:uppercase;letter-spacing:.05em;">Latitude</p>
          <input [(ngModel)]="nearbyLat" type="number" step="0.0001" placeholder="e.g. 28.6139"
                 class="px-3 py-2.5 rounded-xl text-sm"
                 style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;width:150px;"/>
        </div>
        <div>
          <p style="font-size:11px;color:var(--text-secondary);margin:0 0 5px;text-transform:uppercase;letter-spacing:.05em;">Longitude</p>
          <input [(ngModel)]="nearbyLng" type="number" step="0.0001" placeholder="e.g. 77.2090"
                 class="px-3 py-2.5 rounded-xl text-sm"
                 style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;width:150px;"/>
        </div>
        <div>
          <p style="font-size:11px;color:var(--text-secondary);margin:0 0 5px;text-transform:uppercase;letter-spacing:.05em;">Radius (km)</p>
          <select [(ngModel)]="nearbyRadius"
                  class="px-3 py-2.5 rounded-xl text-sm"
                  style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;">
            <option [value]="1">1 km</option>
            <option [value]="2">2 km</option>
            <option [value]="5">5 km</option>
            <option [value]="10">10 km</option>
            <option [value]="25">25 km</option>
          </select>
        </div>
        <button (click)="detectLocation()" [disabled]="detectingLocation()"
                class="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
                style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;"
                [style.opacity]="detectingLocation() ? '.6' : '1'">
          @if (detectingLocation()) {
            <svg class="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="30 60"/>
            </svg>
          } @else {
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v1.5m0 12v1.5M4.5 12H3m18 0h-1.5M7.22 7.22L6.16 6.16m11.68 11.68l-1.06-1.06M7.22 16.78l-1.06 1.06M17.84 6.16l-1.06 1.06M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"/>
            </svg>
          }
          {{ detectingLocation() ? 'Detecting…' : 'Use My Location' }}
        </button>
        <button (click)="searchNearby()" [disabled]="nearbyLoading()"
                class="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                style="background:var(--accent);color:#fff;border:none;cursor:pointer;"
                [style.opacity]="nearbyLoading() ? '.7' : '1'">
          @if (nearbyLoading()) {
            <svg class="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" stroke-width="3"/>
              <path d="M12 2a10 10 0 0110 10" stroke="white" stroke-width="3" stroke-linecap="round"/>
            </svg>
          } @else {
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>
            </svg>
          }
          Search
        </button>
      </div>
      @if (nearbyError()) {
        <p class="mt-3" style="font-size:13px;color:#f4212e;" @fadeIn>{{ nearbyError() }}</p>
      }
    </div>

    <!-- Lot results -->
    @if (!selectedLotId()) {
      @if (nearbyLots().length > 0) {
        <div class="grid gap-3" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));" @fadeIn>
          @for (lot of nearbyLots(); track lot.lotId) {
            <div class="card p-4 cursor-pointer transition-all"
                 style="border:1.5px solid var(--border);"
                 onmouseenter="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)'"
                 onmouseleave="this.style.borderColor='var(--border)';this.style.transform='translateY(0)'"
                 (click)="selectedLotId.set(lot.lotId)">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">{{ lot.name }}</p>
                  <p style="font-size:12px;color:var(--text-secondary);margin:2px 0 0;">{{ lot.address }}, {{ lot.city }}</p>
                </div>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                      style="background:rgba(0,186,124,.1);color:#00ba7c;">APPROVED</span>
              </div>
              <div class="flex items-center justify-between mt-3">
                <span style="font-size:12px;color:var(--text-secondary);">{{ lot.openingTime }} – {{ lot.closingTime }}</span>
                <span class="text-xs font-semibold flex items-center gap-1" style="color:var(--text-secondary);">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                  </svg>
                  {{ lot.latitude.toFixed(4) }}, {{ lot.longitude.toFixed(4) }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-3">
                <p class="text-xs font-semibold m-0" style="color:var(--accent);">View available spots →</p>
                <button (click)="navigateTo(lot, $event)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style="background:rgba(0,186,124,.12);color:#00ba7c;border:1px solid rgba(0,186,124,.25);cursor:pointer;">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                  </svg>
                  Take Me There
                </button>
              </div>
            </div>
          }
        </div>
      } @else if (!nearbyLoading() && nearbySearched()) {
        <div class="card p-10 flex flex-col items-center text-center" @fadeIn>
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.5" class="mb-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
          </svg>
          <p style="font-size:15px;font-weight:600;color:var(--text-primary);margin:0 0 4px;">No lots found nearby</p>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">Try increasing the radius or adjusting your coordinates.</p>
        </div>
      }
    } @else {
      <!-- Back button + spot grid -->
      <div class="flex items-center gap-3">
        <button (click)="selectedLotId.set(null)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
          All Lots
        </button>
      </div>
      <app-driver-spot-grid
        [lotId]="selectedLotId()!"
        [vehicles]="vehicles()"
        (bookingConfirmed)="bookingConfirmed.emit($event)" />
    }
  `
})
export class DriverNearbyComponent implements OnDestroy {
  vehicles = input<Vehicle[]>([]);
  bookingConfirmed = output<{ booking: Booking; cost: number }>();

  private parking  = inject(ParkingService);
  private destroy$ = new Subject<void>();

  nearbyLat         = 0;
  nearbyLng         = 0;
  nearbyRadius      = 5;
  nearbyLots        = signal<ParkingLot[]>([]);
  nearbyLoading     = signal(false);
  nearbyError       = signal('');
  nearbySearched    = signal(false);
  detectingLocation = signal(false);
  selectedLotId     = signal<number | null>(null);

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  detectLocation() {
    if (!navigator.geolocation) { this.nearbyError.set('Geolocation not supported by your browser.'); return; }
    this.detectingLocation.set(true);
    this.nearbyError.set('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.nearbyLat = +pos.coords.latitude.toFixed(6);
        this.nearbyLng = +pos.coords.longitude.toFixed(6);
        this.detectingLocation.set(false);
      },
      () => { this.nearbyError.set('Could not get location. Please enter coordinates manually.'); this.detectingLocation.set(false); }
    );
  }

  navigateTo(lot: ParkingLot, event: Event) {
    event.stopPropagation();
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lot.latitude},${lot.longitude}&travelmode=driving`, '_blank');
  }

  searchNearby() {
    if (!this.nearbyLat || !this.nearbyLng) { this.nearbyError.set('Please enter valid latitude and longitude.'); return; }
    this.nearbyLoading.set(true);
    this.nearbyError.set('');
    this.nearbySearched.set(false);
    this.nearbyLots.set([]);
    this.selectedLotId.set(null);
    this.parking.getNearbyLots(this.nearbyLat, this.nearbyLng, this.nearbyRadius)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: lots => { this.nearbyLots.set(lots); this.nearbyLoading.set(false); this.nearbySearched.set(true); },
        error: () => { this.nearbyError.set('Search failed. Please try again.'); this.nearbyLoading.set(false); this.nearbySearched.set(true); }
      });
  }
}
