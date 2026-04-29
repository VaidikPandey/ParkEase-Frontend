import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { forkJoin } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { ParkingService } from '../../core/services/parking.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking, ParkingLot } from '../../core/models/parking.models';

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#ffd400', CONFIRMED: '#1d9bf0', CHECKED_IN: '#00ba7c',
  CHECKED_OUT: '#94a3b8', CANCELLED: '#f4212e', EXPIRED: '#f4212e'
};

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(16px)' }), animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))])])
  ],
  template: `
    <div class="p-6 space-y-5 page-host" @fadeUp>

      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 style="font-size:22px;font-weight:700;color:var(--text-primary);margin:0;">
            {{ role === 'DRIVER' ? 'My Bookings' : role === 'MANAGER' ? 'Lot Bookings' : 'All Bookings' }}
          </h2>
          <p style="color:var(--text-secondary);font-size:14px;margin:4px 0 0;">{{ filtered().length }} bookings</p>
        </div>

        <div class="flex flex-wrap gap-2 items-center">
          <!-- Manager lot selector -->
          @if (role === 'MANAGER') {
            <select [(ngModel)]="selectedLotId" (ngModelChange)="loadManagerBookings()"
                    class="px-3 py-2 rounded-xl text-sm"
                    style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);outline:none;">
              <option value="">— Select a lot —</option>
              @for (lot of myLots(); track lot.lotId) {
                <option [value]="lot.lotId">{{ lot.name }}</option>
              }
            </select>
          }

          <!-- Status filters -->
          @for (s of statuses; track s) {
            <button (click)="statusFilter.set(statusFilter() === s ? '' : s)"
                    class="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    [style.background]="statusFilter() === s ? STATUS_COLOR[s] + '22' : 'var(--bg-hover)'"
                    [style.border]="'1px solid ' + (statusFilter() === s ? STATUS_COLOR[s] : 'var(--border)')"
                    [style.color]="statusFilter() === s ? STATUS_COLOR[s] : 'var(--text-secondary)'"
                    style="cursor:pointer;">{{ s }}</button>
          }
        </div>
      </div>

      <!-- Manager: prompt to select lot -->
      @if (role === 'MANAGER' && !selectedLotId) {
        <div class="card p-16 flex flex-col items-center text-center" @fadeUp>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.5" class="mb-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/>
          </svg>
          <p style="font-size:15px;font-weight:600;color:var(--text-primary);margin:0 0 4px;">Select a Lot</p>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">Choose a lot above to view its bookings.</p>
        </div>
      }

      <!-- Loading -->
      @else if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="card p-5 animate-pulse" style="height:100px;"></div>
          }
        </div>
      }

      <!-- Empty -->
      @else if (filtered().length === 0) {
        <div class="card p-16 flex flex-col items-center text-center" @fadeUp>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.5" class="mb-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
          </svg>
          <p style="font-size:15px;font-weight:600;color:var(--text-primary);margin:0 0 4px;">No bookings found</p>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">
            {{ statusFilter() ? 'Try a different status filter.' : 'Bookings will appear here.' }}
          </p>
        </div>
      }

      <!-- Booking list -->
      @else {
        <div class="space-y-3" @fadeUp>
          @for (b of filtered(); track b.bookingId) {
            <div class="card p-5">
              <div class="flex flex-wrap items-start gap-4">

                <!-- Left: booking info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span style="font-size:16px;font-weight:800;color:var(--text-primary);">Spot {{ b.spotNumber }}</span>
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                          [style.background]="statusColor(b.status) + '18'"
                          [style.color]="statusColor(b.status)">{{ b.status }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full"
                          style="background:var(--bg-hover);color:var(--text-secondary);">{{ b.bookingType }}</span>
                    <span style="font-size:11px;color:var(--text-secondary);">#{{ b.bookingId }}</span>
                  </div>
                  <div class="grid gap-x-6 gap-y-1" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));">
                    <p style="font-size:12px;color:var(--text-secondary);margin:0;">
                      <span style="font-weight:600;color:var(--text-primary);">Vehicle:</span> {{ b.vehiclePlate }}
                    </p>
                    <p style="font-size:12px;color:var(--text-secondary);margin:0;">
                      <span style="font-weight:600;color:var(--text-primary);">Start:</span> {{ b.startTime | date:'dd MMM, h:mm a' }}
                    </p>
                    <p style="font-size:12px;color:var(--text-secondary);margin:0;">
                      <span style="font-weight:600;color:var(--text-primary);">End:</span> {{ b.endTime | date:'dd MMM, h:mm a' }}
                    </p>
                    @if (b.totalFare) {
                      <p style="font-size:12px;color:var(--text-secondary);margin:0;">
                        <span style="font-weight:600;color:var(--text-primary);">Fare:</span>
                        <span style="color:#00ba7c;font-weight:700;"> ₹{{ b.totalFare }}</span>
                      </p>
                    }
                    @if (b.checkInTime) {
                      <p style="font-size:12px;color:var(--text-secondary);margin:0;">
                        <span style="font-weight:600;color:var(--text-primary);">Check-in:</span> {{ b.checkInTime | date:'h:mm a' }}
                      </p>
                    }
                    @if (b.checkOutTime) {
                      <p style="font-size:12px;color:var(--text-secondary);margin:0;">
                        <span style="font-weight:600;color:var(--text-primary);">Check-out:</span> {{ b.checkOutTime | date:'h:mm a' }}
                      </p>
                    }
                  </div>
                </div>

                <!-- Right: actions -->
                <div class="flex flex-col gap-2 flex-shrink-0">
                  @if (role === 'DRIVER') {
                    @if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
                      <button (click)="checkIn(b.bookingId)" class="action-btn action-btn-green">Check In</button>
                      <button (click)="openExtend(b)" class="action-btn action-btn-blue">Extend</button>
                      <button (click)="cancel(b.bookingId)" class="action-btn action-btn-red">Cancel</button>
                    }
                    @if (b.status === 'CHECKED_IN') {
                      <button (click)="checkOut(b.bookingId)" class="action-btn action-btn-blue">Check Out</button>
                      <button (click)="openExtend(b)" class="action-btn action-btn-blue">Extend</button>
                    }
                    @if (b.status === 'CHECKED_OUT') {
                      <button (click)="downloadReceipt(b.bookingId)" class="action-btn action-btn-grey">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="display:inline;margin-right:4px;">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                        </svg>
                        Receipt
                      </button>
                    }
                  }
                  @if (role === 'MANAGER') {
                    @if (b.status === 'CHECKED_IN') {
                      <span style="font-size:11px;color:#00ba7c;font-weight:600;">Currently Parked</span>
                    }
                  }
                  @if (role === 'ADMIN') {
                    @if (b.status === 'CHECKED_IN') {
                      <button (click)="forceCheckout(b.bookingId)" class="action-btn action-btn-red">Force Checkout</button>
                    }
                    @if (b.status === 'CHECKED_OUT') {
                      <button (click)="downloadReceipt(b.bookingId)" class="action-btn action-btn-grey">Receipt</button>
                    }
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Extend modal -->
      @if (extendBooking()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
             style="background:rgba(0,0,0,.6);backdrop-filter:blur(4px);" @fadeIn
             (click)="extendBooking.set(null)">
          <div class="card p-6 w-full" style="max-width:380px;" (click)="$event.stopPropagation()">
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">Extend Booking</h3>
            <p style="font-size:13px;color:var(--text-secondary);margin:0 0 16px;">
              Spot {{ extendBooking()!.spotNumber }} · currently ends {{ extendBooking()!.endTime | date:'h:mm a, dd MMM' }}
            </p>
            <div class="mb-4">
              <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;">New End Time</p>
              <input [(ngModel)]="newEndTime" type="datetime-local"
                     class="w-full px-3 py-2.5 rounded-xl text-sm"
                     style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;"/>
            </div>
            @if (extendError()) {
              <p class="mb-3" style="font-size:13px;color:#f4212e;">{{ extendError() }}</p>
            }
            <div class="flex gap-3">
              <button (click)="confirmExtend()" [disabled]="extendLoading()"
                      class="flex-1 btn-accent py-2.5 text-sm"
                      [style.opacity]="extendLoading() ? '.6' : '1'">
                {{ extendLoading() ? 'Extending…' : 'Confirm Extension' }}
              </button>
              <button (click)="extendBooking.set(null)"
                      style="padding:10px 18px;border-radius:9999px;border:1px solid var(--border);background:transparent;color:var(--text-secondary);cursor:pointer;font-size:13px;">
                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .action-btn { padding:7px 16px;border-radius:9999px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:opacity 160ms;display:flex;align-items:center; }
    .action-btn-green { background:rgba(0,186,124,.12);color:#00ba7c; }
    .action-btn-blue  { background:rgba(29,155,240,.12);color:#1d9bf0; }
    .action-btn-red   { background:rgba(244,33,46,.1);color:#f4212e; }
    .action-btn-grey  { background:var(--bg-hover);color:var(--text-secondary);border:1px solid var(--border); }
    .action-btn:hover { opacity:.75; }
  `]
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

  filtered = computed(() => {
    const f = this.statusFilter();
    return f ? this.allBookings().filter(b => b.status === f) : this.allBookings();
  });

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

  statusColor(s: string) { return STATUS_COLOR[s] ?? '#94a3b8'; }
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
    // default to 2 hours after current end
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
