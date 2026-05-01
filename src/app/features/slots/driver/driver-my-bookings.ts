import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';

declare const Razorpay: any;
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Booking } from '../../../core/models/parking.models';

@Component({
  selector: 'app-driver-my-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn',  [transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))])]),
    trigger('fadeUp',  [transition(':enter', [style({ opacity: 0, transform: 'translateY(16px)' }), animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  template: `
    <div @fadeIn>
      @if (refundError()) {
        <div class="mb-4 px-4 py-3 rounded-xl flex items-center gap-2"
             style="background:rgba(244,33,46,.08);border:1px solid rgba(244,33,46,.2);">
          <p style="font-size:13px;color:#f4212e;margin:0;">{{ refundError() }}</p>
        </div>
      }

      @if (bookingsLoading()) {
        <div class="grid gap-4" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr));">
          @for (i of [1,2,3]; track i) {
            <div class="card p-5 animate-pulse" style="height:160px;"></div>
          }
        </div>
      } @else if (myBookings().length === 0) {
        <div class="card p-14 flex flex-col items-center text-center" @fadeUp>
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.3" class="mb-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p style="font-size:15px;font-weight:600;color:var(--text-primary);margin:0 0 4px;">No bookings yet</p>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">Browse lots and book a spot to get started.</p>
        </div>
      } @else {
        <div class="grid gap-4" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr));" @fadeUp>
          @for (b of myBookings(); track b.bookingId) {
            <div class="card p-5">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;">Spot {{ b.spotNumber }}</p>
                  <p style="font-size:11px;color:var(--text-secondary);margin:2px 0 0;font-family:monospace;">#{{ b.bookingId }} · {{ b.vehiclePlate }}</p>
                </div>
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      [style.color]="statusColor(b.status)"
                      [style.background]="statusBg(b.status)">{{ b.status }}</span>
              </div>

              <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="rounded-xl px-3 py-2" style="background:var(--bg-secondary);">
                  <p style="font-size:10px;color:var(--text-secondary);margin:0 0 2px;text-transform:uppercase;letter-spacing:.04em;">Start</p>
                  <p style="font-size:12px;font-weight:600;color:var(--text-primary);margin:0;">{{ b.startTime | date:'d MMM, HH:mm' }}</p>
                </div>
                <div class="rounded-xl px-3 py-2" style="background:var(--bg-secondary);">
                  <p style="font-size:10px;color:var(--text-secondary);margin:0 0 2px;text-transform:uppercase;letter-spacing:.04em;">End</p>
                  <p style="font-size:12px;font-weight:600;color:var(--text-primary);margin:0;">{{ b.endTime | date:'d MMM, HH:mm' }}</p>
                </div>
              </div>

              <div class="flex items-center justify-between mb-4">
                <span style="font-size:12px;color:var(--text-secondary);">₹{{ b.pricePerHour }}/hr · {{ b.bookingType === 'WALK_IN' ? 'Walk-In' : 'Pre-Book' }}</span>
                @if (b.totalFare) {
                  <span style="font-size:14px;font-weight:700;color:var(--accent);">₹{{ b.totalFare }}</span>
                }
              </div>

              @if (b.status === 'CHECKED_IN') {
                <button (click)="doCheckOut(b)" [disabled]="checkingOutId() === b.bookingId"
                        class="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        style="background:rgba(0,186,124,.1);border:1px solid rgba(0,186,124,.25);color:#00ba7c;cursor:pointer;"
                        [style.opacity]="checkingOutId() === b.bookingId ? '.6' : '1'">
                  @if (checkingOutId() === b.bookingId) {
                    <svg class="animate-spin" width="13" height="13" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="rgba(0,186,124,.3)" stroke-width="3"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="#00ba7c" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                    Checking out…
                  } @else {
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
                    </svg>
                    Check Out
                  }
                </button>
              } @else if (canCancelRefund(b.status)) {
                @if (extendingId() === b.bookingId) {
                  <div class="mb-2" @fadeIn>
                    <div class="flex gap-2 mb-2">
                      <input [(ngModel)]="extendNewEnd[b.bookingId]" type="datetime-local"
                             (ngModelChange)="onExtendEndChange()"
                             class="flex-1 px-3 py-2 rounded-xl text-sm"
                             style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;"/>
                      <button (click)="doExtend(b)"
                              class="px-3 py-2 rounded-xl text-sm font-semibold"
                              style="background:var(--accent);color:#fff;border:none;cursor:pointer;white-space:nowrap;">
                        {{ extraCharge(b) ? 'Pay & Extend' : 'Extend' }}
                      </button>
                      <button (click)="extendingId.set(null)"
                              style="background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:0 6px;">✕</button>
                    </div>
                    @if (extendNewEnd[b.bookingId] && extraCharge(b) !== null) {
                      <div class="flex items-center justify-between px-3 py-2 rounded-xl" @fadeIn
                           style="background:rgba(0,186,124,.08);border:1px solid rgba(0,186,124,.2);">
                        <span style="font-size:12px;color:var(--text-secondary);">Additional charge</span>
                        <span style="font-size:13px;font-weight:700;color:#00ba7c;">+ ₹{{ extraCharge(b) }}</span>
                      </div>
                    }
                  </div>
                }
                <div class="flex gap-2">
                  <button (click)="doCheckIn(b)" [disabled]="checkingInId() === b.bookingId"
                          class="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                          style="background:rgba(29,155,240,.1);border:1px solid rgba(29,155,240,.25);color:var(--accent);cursor:pointer;"
                          [style.opacity]="checkingInId() === b.bookingId ? '.6' : '1'">
                    @if (checkingInId() === b.bookingId) {
                      <svg class="animate-spin" width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="rgba(29,155,240,.3)" stroke-width="3"/>
                        <path d="M12 2a10 10 0 0110 10" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
                      </svg>
                    } @else {
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 15l3-3m0 0l-3-3m3 3H3"/>
                      </svg>
                    }
                    Check In
                  </button>
                  <button (click)="openExtend(b)"
                          class="px-3 py-2.5 rounded-xl text-sm font-semibold"
                          style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;">
                    Extend
                  </button>
                  <button (click)="cancelAndRefund(b)"
                          [disabled]="cancellingId() === b.bookingId || refundingId() === b.bookingId"
                          class="px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                          style="background:rgba(244,33,46,.08);border:1px solid rgba(244,33,46,.2);color:#f4212e;cursor:pointer;"
                          [style.opacity]="cancellingId() === b.bookingId || refundingId() === b.bookingId ? '.6' : '1'">
                    @if (cancellingId() === b.bookingId || refundingId() === b.bookingId) {
                      <svg class="animate-spin" width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="rgba(244,33,46,.3)" stroke-width="3"/>
                        <path d="M12 2a10 10 0 0110 10" stroke="#f4212e" stroke-width="3" stroke-linecap="round"/>
                      </svg>
                    } @else {
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>
                      </svg>
                    }
                    Refund
                  </button>
                </div>
              } @else {
                <div class="w-full py-2 text-center rounded-xl text-xs"
                     style="background:var(--bg-secondary);color:var(--text-secondary);">
                  {{ ['CHECKED_OUT','CANCELLED','EXPIRED'].includes(b.status) ? 'No action available' : 'Cannot cancel after check-in' }}
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class DriverMyBookingsComponent implements OnDestroy {
  private bookingSvc = inject(BookingService);
  private paySvc     = inject(PaymentService);
  private destroy$   = new Subject<void>();

  myBookings      = signal<Booking[]>([]);
  bookingsLoading = signal(true);
  cancellingId    = signal<number | null>(null);
  refundingId     = signal<number | null>(null);
  refundError     = signal('');
  checkingInId    = signal<number | null>(null);
  checkingOutId   = signal<number | null>(null);
  extendingId     = signal<number | null>(null);
  extendNewEnd: Record<number, string> = {};

  constructor() {
    this.loadMyBookings();
    if (!(window as any).Razorpay) {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(s);
    }
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  loadMyBookings() {
    this.bookingsLoading.set(true);
    this.refundError.set('');
    this.bookingSvc.getMyBookings().pipe(takeUntil(this.destroy$)).subscribe({
      next: b => { this.myBookings.set(b.sort((a, z) => z.bookingId - a.bookingId)); this.bookingsLoading.set(false); },
      error: () => this.bookingsLoading.set(false)
    });
  }

  cancelAndRefund(booking: Booking) {
    this.cancellingId.set(booking.bookingId);
    this.refundError.set('');
    this.bookingSvc.cancel(booking.bookingId, 'CHANGE_OF_PLANS').pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.refundingId.set(booking.bookingId);
        this.paySvc.refund({ bookingId: booking.bookingId, reason: 'Cancelled by driver' })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => { this.cancellingId.set(null); this.refundingId.set(null); this.loadMyBookings(); },
            error: () => { this.cancellingId.set(null); this.refundingId.set(null); this.loadMyBookings(); }
          });
      },
      error: (err: any) => { this.cancellingId.set(null); this.refundError.set(err?.error?.message ?? 'Failed to cancel booking.'); }
    });
  }

  doCheckIn(booking: Booking) {
    this.checkingInId.set(booking.bookingId);
    this.bookingSvc.checkIn(booking.bookingId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.checkingInId.set(null); this.loadMyBookings(); },
      error: (err: any) => { this.checkingInId.set(null); this.refundError.set(err?.error?.message ?? 'Check-in failed.'); }
    });
  }

  doCheckOut(booking: Booking) {
    this.checkingOutId.set(booking.bookingId);
    this.bookingSvc.checkOut(booking.bookingId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.checkingOutId.set(null); this.loadMyBookings(); },
      error: (err: any) => { this.checkingOutId.set(null); this.refundError.set(err?.error?.message ?? 'Check-out failed.'); }
    });
  }

  openExtend(booking: Booking) {
    const end = new Date(booking.endTime.endsWith('Z') ? booking.endTime : booking.endTime + 'Z');
    end.setHours(end.getHours() + 1);
    this.extendNewEnd[booking.bookingId] = this.toLocalDT(end);
    this.extendingId.set(booking.bookingId);
  }

  private toLocalDT(d: Date): string {
    const p = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  onExtendEndChange() { /* triggers extraCharge() recompute via template binding */ }

  extraCharge(booking: Booking): number | null {
    const newEndStr = this.extendNewEnd[booking.bookingId];
    if (!newEndStr || !booking.pricePerHour) return null;
    const fareStart = booking.checkInTime ? new Date(booking.checkInTime) : new Date(booking.startTime);
    const newEnd = new Date(newEndStr);
    if (newEnd <= fareStart) return null;
    const newTotal = booking.pricePerHour * ((newEnd.getTime() - fareStart.getTime()) / 3_600_000);
    const extra = newTotal - (booking.totalFare ?? 0);
    return extra > 0 ? Math.round(extra * 100) / 100 : null;
  }

  async doExtend(booking: Booking) {
    const newEndStr = this.extendNewEnd[booking.bookingId];
    if (!newEndStr) return;

    const extra = this.extraCharge(booking);
    const newEndIso = new Date(newEndStr).toISOString().slice(0, 19);

    const callExtend = () => {
      this.bookingSvc.extend(booking.bookingId, newEndIso)
        .pipe(takeUntil(this.destroy$)).subscribe({
          next: () => { this.extendingId.set(null); this.loadMyBookings(); },
          error: (err: any) => { this.refundError.set(err?.error?.message ?? 'Extend failed.'); }
        });
    };

    if (!extra || extra <= 0) { callExtend(); return; }

    try {
      const order = await firstValueFrom(this.paySvc.createOrder({ bookingId: booking.bookingId, amount: extra }));
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'ParkEase — Booking Extension',
        description: `Extension for Booking #${booking.bookingId}`,
        order_id: order.orderId,
        handler: () => callExtend(),
        modal: { ondismiss: () => {} },
        prefill: { name: 'ParkEase User' },
        theme: { color: '#1d9bf0' },
      };
      new Razorpay(options).open();
    } catch (e: any) {
      this.refundError.set(e?.message ?? 'Could not initiate payment for extension.');
    }
  }

  canCancelRefund(status: string) { return status === 'PENDING' || status === 'CONFIRMED'; }

  statusColor(s: string) {
    if (s === 'CONFIRMED' || s === 'CHECKED_IN') return '#00ba7c';
    if (s === 'PENDING')    return '#ffd400';
    if (s === 'CHECKED_OUT') return 'var(--accent)';
    return '#f4212e';
  }

  statusBg(s: string) {
    if (s === 'CONFIRMED' || s === 'CHECKED_IN') return 'rgba(0,186,124,.12)';
    if (s === 'PENDING')    return 'rgba(255,212,0,.12)';
    if (s === 'CHECKED_OUT') return 'rgba(29,155,240,.12)';
    return 'rgba(244,33,46,.12)';
  }
}
