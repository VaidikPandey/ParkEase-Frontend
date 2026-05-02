import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { ParkingService } from '../../core/services/parking.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking, ParkingLot } from '../../core/models/parking.models';
import { ThemeSelectComponent, ThemeSelectOption } from '../../shared/components/theme-select/theme-select';

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#ffd400', CONFIRMED: '#1d9bf0', CHECKED_IN: '#00ba7c',
  CHECKED_OUT: '#71767b', CANCELLED: '#f4212e', EXPIRED: '#f4212e'
};

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemeSelectComponent],
  template: `
    <div style="max-width:1100px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header -->
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
          <div>
            <h1 style="font-size:22px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.3px;">
              {{ role === 'DRIVER' ? 'My Bookings' : role === 'MANAGER' ? 'Lot Bookings' : 'All Bookings' }}
            </h1>
            <p style="font-size:13px;color:#71767b;margin:0;">{{ filtered().length }} bookings</p>
          </div>

          <!-- Manager lot selector -->
          @if (role === 'MANAGER') {
            <app-theme-select
              label="Select Lot"
              placeholder="Choose a lot"
              width="280px"
              [searchable]="true"
              [options]="managerLotOptions()"
              [value]="selectedLotId"
              clearLabel="No lot selected"
              (valueChange)="selectManagerBookingLot($event)" />
          }
        </div>

        <!-- Status filters -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          @for (s of statuses; track s) {
            <button (click)="statusFilter.set(statusFilter() === s ? '' : s)"
                    style="font-size:11px;font-weight:700;padding:5px 12px;border-radius:9999px;cursor:pointer;transition:all 150ms ease;letter-spacing:.04em;text-transform:uppercase;"
                    [style.background]="statusFilter() === s ? STATUS_COLOR[s] + '22' : 'rgba(255,255,255,.04)'"
                    [style.border]="'1px solid ' + (statusFilter() === s ? STATUS_COLOR[s] + '60' : 'rgba(255,255,255,.08)')"
                    [style.color]="statusFilter() === s ? STATUS_COLOR[s] : '#71767b'">
              {{ s }}
            </button>
          }
        </div>
      </div>

      <!-- Manager: prompt to select lot -->
      @if (role === 'MANAGER' && !selectedLotId) {
        <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:64px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;" class="anim-in anim-d1">
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(29,155,240,.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/>
            </svg>
          </div>
          <p style="font-size:15px;font-weight:700;color:#e7e9ea;margin:0 0 6px;">Select a Lot</p>
          <p style="font-size:13px;color:#71767b;margin:0;">Choose a lot above to view its bookings.</p>
        </div>
      }

      <!-- Loading -->
      @else if (loading()) {
        <div style="display:flex;flex-direction:column;gap:8px;">
          @for (i of [1,2,3]; track i) {
            <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:12px;height:100px;animation:pulse 1.5s ease-in-out infinite;"></div>
          }
        </div>
      }

      <!-- Empty -->
      @else if (filtered().length === 0) {
        <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:64px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;" class="anim-in anim-d1">
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(113,118,123,.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#71767b" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
            </svg>
          </div>
          <p style="font-size:15px;font-weight:700;color:#e7e9ea;margin:0 0 6px;">No bookings found</p>
          <p style="font-size:13px;color:#71767b;margin:0;">{{ statusFilter() ? 'Try a different status filter.' : 'Bookings will appear here.' }}</p>
        </div>
      }

      <!-- Booking list -->
      @else {
        <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">
          @for (b of filtered(); track b.bookingId; let last = $last) {
            <div style="display:flex;align-items:flex-start;gap:16px;padding:16px 20px;transition:background 120ms ease;cursor:default;"
                 [style.border-bottom]="last ? 'none' : '1px solid rgba(255,255,255,.04)'"
                 onmouseenter="this.style.background='rgba(255,255,255,.03)'"
                 onmouseleave="this.style.background='transparent'">

              <!-- Status dot -->
              <div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:6px;"
                   [style.background]="statusColor(b.status)"></div>

              <!-- Main info -->
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
                  <span style="font-size:15px;font-weight:800;color:#e7e9ea;letter-spacing:-.2px;">Spot {{ b.spotNumber }}</span>
                  <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:.06em;text-transform:uppercase;"
                        [style.background]="statusColor(b.status) + '18'" [style.color]="statusColor(b.status)">{{ b.status }}</span>
                  <span style="font-size:11px;font-weight:600;padding:2px 7px;border-radius:6px;background:rgba(255,255,255,.05);color:#71767b;text-transform:uppercase;letter-spacing:.04em;">{{ b.bookingType }}</span>
                  <span style="font-size:11px;color:#536471;">#{{ b.bookingId }}</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:10px 24px;">
                  <span style="font-size:12px;color:#71767b;"><span style="color:#e7e9ea;font-weight:600;">Vehicle</span> {{ b.vehiclePlate }}</span>
                  <span style="font-size:12px;color:#71767b;"><span style="color:#e7e9ea;font-weight:600;">Start</span> {{ b.startTime | date:'dd MMM, h:mm a' }}</span>
                  <span style="font-size:12px;color:#71767b;"><span style="color:#e7e9ea;font-weight:600;">End</span> {{ b.endTime | date:'dd MMM, h:mm a' }}</span>
                  @if (b.totalFare) {
                    <span style="font-size:12px;"><span style="color:#e7e9ea;font-weight:600;">Fare</span> <span style="color:#00ba7c;font-weight:700;"> ₹{{ b.totalFare }}</span></span>
                  }
                  @if (b.checkInTime) {
                    <span style="font-size:12px;color:#71767b;"><span style="color:#e7e9ea;font-weight:600;">In</span> {{ b.checkInTime | date:'h:mm a' }}</span>
                  }
                  @if (b.checkOutTime) {
                    <span style="font-size:12px;color:#71767b;"><span style="color:#e7e9ea;font-weight:600;">Out</span> {{ b.checkOutTime | date:'h:mm a' }}</span>
                  }
                </div>
              </div>

              <!-- Actions -->
              <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;align-items:flex-end;">
                @if (role === 'DRIVER') {
                  @if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
                    <button (click)="checkIn(b.bookingId)" style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;background:rgba(0,186,124,.1);color:#00ba7c;border:none;transition:opacity 150ms;" onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">Check In</button>
                    <button (click)="openExtend(b)" style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;background:rgba(29,155,240,.1);color:#1d9bf0;border:none;transition:opacity 150ms;" onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">Extend</button>
                    <button (click)="cancel(b.bookingId)" style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;background:rgba(244,33,46,.08);color:#f4212e;border:none;transition:opacity 150ms;" onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">Cancel</button>
                  }
                  @if (b.status === 'CHECKED_IN') {
                    <button (click)="checkOut(b.bookingId)" style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;background:rgba(29,155,240,.1);color:#1d9bf0;border:none;transition:opacity 150ms;" onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">Check Out</button>
                    <button (click)="openExtend(b)" style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;background:rgba(29,155,240,.08);color:#1d9bf0;border:none;transition:opacity 150ms;" onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">Extend</button>
                  }
                  @if (b.status === 'CHECKED_OUT') {
                    <button (click)="downloadReceipt(b.bookingId)" style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;background:rgba(255,255,255,.06);color:#e7e9ea;border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:5px;transition:opacity 150ms;" onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                      Receipt
                    </button>
                  }
                }
                @if (role === 'MANAGER') {
                  @if (b.status === 'CHECKED_IN') {
                    <span style="font-size:11px;color:#00ba7c;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Currently Parked</span>
                  }
                }
                @if (role === 'ADMIN') {
                  @if (b.status === 'CHECKED_IN') {
                    <button (click)="forceCheckout(b.bookingId)" style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;background:rgba(244,33,46,.08);color:#f4212e;border:none;transition:opacity 150ms;" onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">Force Checkout</button>
                  }
                  @if (b.status === 'CHECKED_OUT') {
                    <button (click)="downloadReceipt(b.bookingId)" style="font-size:12px;padding:6px 14px;border-radius:9999px;font-weight:600;cursor:pointer;background:rgba(255,255,255,.06);color:#e7e9ea;border:1px solid rgba(255,255,255,.1);transition:opacity 150ms;" onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">Receipt</button>
                  }
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Extend modal -->
      @if (extendBooking()) {
        <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);"
             (click)="extendBooking.set(null)">
          <div style="background:#0f0f0f;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;width:100%;max-width:380px;" class="anim-in" (click)="$event.stopPropagation()">
            <h3 style="font-size:16px;font-weight:800;color:#e7e9ea;margin:0 0 6px;">Extend Booking</h3>
            <p style="font-size:13px;color:#71767b;margin:0 0 20px;">
              Spot {{ extendBooking()!.spotNumber }} · currently ends {{ extendBooking()!.endTime | date:'h:mm a, dd MMM' }}
            </p>
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">New End Time</label>
              <input [(ngModel)]="newEndTime" type="datetime-local"
                     style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                     onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
            </div>
            @if (extendError()) {
              <p style="font-size:13px;color:#f4212e;margin:0 0 14px;">{{ extendError() }}</p>
            }
            <div style="display:flex;gap:10px;">
              <button (click)="confirmExtend()" [disabled]="extendLoading()"
                      style="flex:1;padding:11px;border-radius:12px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                      [style.opacity]="extendLoading() ? '.5' : '1'">
                {{ extendLoading() ? 'Extending…' : 'Confirm Extension' }}
              </button>
              <button (click)="extendBooking.set(null)"
                      style="flex:1;padding:11px;border-radius:12px;background:rgba(255,255,255,.05);color:#e7e9ea;border:1px solid rgba(255,255,255,.08);font-size:14px;font-weight:600;cursor:pointer;">
                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class BookingsComponent implements OnInit {
  private bookingSvc  = inject(BookingService);
  private parkingSvc  = inject(ParkingService);
  private paySvc      = inject(PaymentService);
  private auth        = inject(AuthService);
  private toast       = inject(ToastService);

  readonly STATUS_COLOR = STATUS_COLOR;
  role = this.auth.currentUser()?.role;

  allBookings  = signal<Booking[]>([]);
  myLots       = signal<ParkingLot[]>([]);
  loading      = signal(false);
  statusFilter = signal('');
  selectedLotId: any = '';

  extendBooking = signal<Booking | null>(null);
  newEndTime    = '';
  extendLoading = signal(false);
  extendError   = signal('');

  statuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'EXPIRED'];
  managerLotOptions = computed<ThemeSelectOption[]>(() =>
    this.myLots().map(lot => ({
      label: lot.name,
      value: String(lot.lotId),
      meta: `${lot.city} · ${lot.status}`,
    }))
  );

  filtered = computed(() => {
    const f = this.statusFilter();
    return f ? this.allBookings().filter(b => b.status === f) : this.allBookings();
  });

  selectManagerBookingLot(lotId: string) {
    this.selectedLotId = lotId;
    this.loadManagerBookings();
  }

  ngOnInit() {
    if (this.role === 'DRIVER') {
      this.loading.set(true);
      this.bookingSvc.getMyBookings().subscribe({
        next: b => { this.allBookings.set(this.sorted(b)); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    } else if (this.role === 'MANAGER') {
      this.parkingSvc.getManagerLots().subscribe({
        next: lots => this.myLots.set(lots),
        error: () => {}
      });
    } else if (this.role === 'ADMIN') {
      this.loading.set(true);
      this.bookingSvc.getAllBookings().subscribe({
        next: b => { this.allBookings.set(this.sorted(b)); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    }
  }

  loadManagerBookings() {
    if (!this.selectedLotId) return;
    this.loading.set(true);
    this.bookingSvc.getBookingsByLot(+this.selectedLotId).subscribe({
      next: b => { this.allBookings.set(this.sorted(b)); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusColor(s: string) { return STATUS_COLOR[s] ?? '#71767b'; }
  private sorted(b: Booking[]) { return b.sort((a, z) => z.bookingId - a.bookingId); }

  checkIn(id: number) {
    this.bookingSvc.checkIn(id).subscribe({
      next: b => { this.update(b); this.toast.success('Checked in successfully.'); },
      error: err => this.toast.error(err?.error?.message ?? 'Check-in failed.')
    });
  }

  checkOut(id: number) {
    this.bookingSvc.checkOut(id).subscribe({
      next: b => { this.update(b); this.toast.success('Checked out. See you next time!'); },
      error: err => this.toast.error(err?.error?.message ?? 'Check-out failed.')
    });
  }

  cancel(id: number) {
    this.bookingSvc.cancel(id).subscribe({
      next: b => { this.update(b); this.toast.info('Booking cancelled.'); },
      error: err => this.toast.error(err?.error?.message ?? 'Cancel failed.')
    });
  }

  forceCheckout(id: number) {
    this.bookingSvc.forceCheckout(id).subscribe({
      next: b => { this.update(b); this.toast.success('Force checkout done.'); },
      error: err => this.toast.error(err?.error?.message ?? 'Failed.')
    });
  }

  openExtend(b: Booking) {
    this.extendBooking.set(b);
    this.extendError.set('');
    const d = new Date(b.endTime);
    d.setHours(d.getHours() + 2);
    this.newEndTime = new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }

  confirmExtend() {
    const b = this.extendBooking();
    if (!b || !this.newEndTime) { this.extendError.set('Select a new end time.'); return; }
    const endDT = this.newEndTime.length === 16 ? this.newEndTime + ':00' : this.newEndTime;
    if (new Date(endDT) <= new Date(b.endTime)) {
      this.extendError.set('New end time must be after current end time.'); return;
    }
    this.extendLoading.set(true);
    this.extendError.set('');
    this.bookingSvc.extend(b.bookingId, endDT).subscribe({
      next: updated => {
        this.update(updated);
        this.extendBooking.set(null);
        this.extendLoading.set(false);
        this.toast.success('Booking extended successfully.');
      },
      error: err => {
        this.extendError.set(err?.error?.message ?? 'Failed to extend booking.');
        this.extendLoading.set(false);
      }
    });
  }

  downloadReceipt(bookingId: number) {
    this.paySvc.downloadReceipt(bookingId).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-booking-${bookingId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success('Receipt downloaded.');
      },
      error: () => this.toast.error('No receipt found for this booking.')
    });
  }

  private update(b: Booking) {
    this.allBookings.update(list => list.map(x => x.bookingId === b.bookingId ? b : x));
  }
}
