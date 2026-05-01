import { Component, input, output, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { firstValueFrom } from 'rxjs';
import { PaymentService, PaymentMode } from '../../../core/services/payment.service';
import { Booking, Payment } from '../../../core/models/parking.models';

declare const Razorpay: any;

@Component({
  selector: 'app-driver-payment-modal',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn',  [transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))])]),
    trigger('scaleIn', [transition(':enter', [style({ opacity: 0, transform: 'scale(.88)' }), animate('320ms cubic-bezier(.34,1.56,.64,1)', style({ opacity: 1, transform: 'scale(1)' }))])]),
    trigger('checkAnim', [transition(':enter', [style({ opacity: 0, transform: 'scale(0) rotate(-45deg)' }), animate('500ms cubic-bezier(.34,1.56,.64,1)', style({ opacity: 1, transform: 'scale(1) rotate(0)' }))])]),
  ],
  styles: [`
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    @keyframes ping { 0% { transform: scale(1); opacity: 1; } 75%, 100% { transform: scale(1.4); opacity: 0; } }
  `],
  template: `
    <div class="fixed inset-0 z-50 flex items-stretch"
         style="background:rgba(0,0,0,.75);backdrop-filter:blur(8px);" @fadeIn>
      <div class="relative flex flex-col m-auto w-full overflow-y-auto"
           style="max-width:900px;max-height:100vh;background:var(--bg-primary);border-radius:24px;box-shadow:0 32px 80px rgba(0,0,0,.5);" @scaleIn
           (click)="$event.stopPropagation()">

        <div style="position:absolute;top:0;left:0;right:0;height:4px;border-radius:24px 24px 0 0;background:linear-gradient(90deg,var(--accent),#7c3aed,var(--accent));background-size:200% 100%;animation:shimmer 2s linear infinite;z-index:1;"></div>

        @if (!isDone()) {
          <div class="grid" style="grid-template-columns:1fr 1fr;min-height:520px;">

            <!-- Left: booking summary -->
            <div class="flex flex-col p-8 pt-10"
                 style="border-right:1px solid var(--border);background:linear-gradient(160deg,var(--bg-secondary) 0%,var(--bg-primary) 100%);">
              <div class="flex items-center gap-3 mb-8">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center"
                     style="background:var(--accent-dim);border:1px solid rgba(29,155,240,.2);">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                  </svg>
                </div>
                <div>
                  <h3 style="font-size:18px;font-weight:800;color:var(--text-primary);margin:0;">Secure Checkout</h3>
                  <p style="font-size:12px;color:var(--text-secondary);margin:0;">Powered by Razorpay</p>
                </div>
              </div>

              <div class="mb-6 rounded-2xl p-6"
                   style="background:linear-gradient(135deg,var(--accent-dim),rgba(124,58,237,.08));border:1px solid rgba(29,155,240,.2);">
                <p style="font-size:11px;color:var(--text-secondary);margin:0 0 4px;text-transform:uppercase;letter-spacing:.08em;">Total Due</p>
                <p style="font-size:48px;font-weight:900;color:var(--accent);margin:0;line-height:1;letter-spacing:-2px;">₹{{ totalAmount() }}</p>
                <p style="font-size:13px;color:var(--text-secondary);margin:8px 0 0;">One-time parking fee</p>
              </div>

              <div class="space-y-3 flex-1">
                <div class="flex justify-between items-center py-2.5" style="border-bottom:1px solid var(--border);">
                  <span style="font-size:13px;color:var(--text-secondary);">Booking ID</span>
                  <span style="font-size:13px;font-weight:700;color:var(--text-primary);font-family:monospace;">#{{ booking().bookingId }}</span>
                </div>
                <div class="flex justify-between items-center py-2.5" style="border-bottom:1px solid var(--border);">
                  <span style="font-size:13px;color:var(--text-secondary);">Spot</span>
                  <span style="font-size:13px;font-weight:700;color:var(--text-primary);">{{ booking().spotNumber }}</span>
                </div>
                <div class="flex justify-between items-center py-2.5" style="border-bottom:1px solid var(--border);">
                  <span style="font-size:13px;color:var(--text-secondary);">Vehicle</span>
                  <span style="font-size:13px;font-weight:700;color:var(--text-primary);font-family:monospace;">{{ booking().vehiclePlate }}</span>
                </div>
                <div class="flex justify-between items-center py-2.5">
                  <span style="font-size:13px;color:var(--text-secondary);">Status</span>
                  <span class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                        style="background:rgba(29,155,240,.12);color:var(--accent);">{{ booking().status }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2 mt-6 pt-4" style="border-top:1px solid var(--border);">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                </svg>
                <span style="font-size:11px;color:var(--text-secondary);">256-bit TLS encryption · Powered by Razorpay</span>
              </div>
            </div>

            <!-- Right: payment options -->
            <div class="flex flex-col p-8 pt-10">
              <button (click)="closed.emit()"
                      style="position:absolute;top:16px;right:16px;background:transparent;border:none;cursor:pointer;color:var(--text-secondary);padding:6px;border-radius:8px;"
                      onmouseenter="this.style.background='var(--bg-hover)'" onmouseleave="this.style.background='transparent'">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>

              <p style="font-size:11px;color:var(--text-secondary);margin:0 0 10px;text-transform:uppercase;letter-spacing:.06em;">Choose Payment Method</p>
              <div class="grid grid-cols-4 gap-2 mb-6">
                @for (m of payMethods; track m.id) {
                  <button (click)="payMode = m.id; payError.set('')"
                          class="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                          [style.background]="payMode === m.id ? 'var(--accent-dim)' : 'var(--bg-hover)'"
                          [style.border]="'1px solid ' + (payMode === m.id ? 'var(--accent)' : 'var(--border)')"
                          style="cursor:pointer;outline:none;">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
                         [attr.stroke]="payMode === m.id ? 'var(--accent)' : 'var(--text-secondary)'" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="m.icon"/>
                    </svg>
                    <span style="font-size:10px;font-weight:600;"
                          [style.color]="payMode === m.id ? 'var(--accent)' : 'var(--text-secondary)'">{{ m.label }}</span>
                  </button>
                }
              </div>

              @if (payMode !== 'CASH') {
                <div class="mb-5 rounded-2xl p-4" style="background:var(--bg-secondary);border:1px solid var(--border);">
                  <p style="font-size:13px;color:var(--text-secondary);margin:0;line-height:1.5;">
                    You will be redirected to <strong style="color:var(--text-primary);">Razorpay</strong> secure checkout.
                    Cards, UPI, Netbanking and Wallets are all supported in one place.
                  </p>
                </div>
              }

              @if (payMode === 'CASH') {
                <div class="mb-5 rounded-2xl p-4" style="background:rgba(0,186,124,.07);border:1px solid rgba(0,186,124,.18);">
                  <p style="font-size:13px;color:#00ba7c;margin:0;line-height:1.5;">
                    Pay <strong>₹{{ totalAmount() }}</strong> in cash at the parking booth when you arrive. Your spot is reserved.
                  </p>
                </div>
              }

              @if (payError()) {
                <div class="mb-3 px-4 py-2.5 rounded-xl" @fadeIn
                     style="background:rgba(244,33,46,.08);border:1px solid rgba(244,33,46,.2);">
                  <p style="font-size:13px;color:#f4212e;margin:0;">{{ payError() }}</p>
                </div>
              }

              <div class="flex-1"></div>

              <button (click)="submitPayment()" [disabled]="payLoading()"
                      class="w-full py-3.5 rounded-2xl text-sm font-bold"
                      style="background:var(--accent);color:#fff;border:none;cursor:pointer;letter-spacing:.02em;"
                      [style.opacity]="payLoading() ? '.75' : '1'">
                @if (payLoading()) {
                  <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" stroke-width="3"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="white" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                    Processing…
                  </span>
                } @else {
                  <span>{{ payMode === 'CASH' ? 'Confirm Cash Payment' : 'Pay ₹' + totalAmount() + ' via Razorpay' }}</span>
                }
              </button>
            </div>
          </div>
        }

        @if (isDone()) {
          <div class="flex flex-col items-center justify-center text-center py-16 px-8" @scaleIn>
            <div class="relative mb-5" @checkAnim>
              <div class="w-20 h-20 rounded-full flex items-center justify-center"
                   style="background:rgba(0,186,124,.1);border:2px solid rgba(0,186,124,.25);">
                <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="#00ba7c" stroke-width="2.2"
                     style="filter:drop-shadow(0 0 8px rgba(0,186,124,.5));">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div style="position:absolute;inset:-6px;border-radius:50%;border:1px solid rgba(0,186,124,.15);animation:ping 1.4s ease-out infinite;"></div>
              <div style="position:absolute;inset:-14px;border-radius:50%;border:1px solid rgba(0,186,124,.08);animation:ping 1.4s ease-out infinite .3s;"></div>
            </div>

            <h3 style="font-size:20px;font-weight:800;color:var(--text-primary);margin:0 0 6px;">Payment Successful</h3>
            <p style="font-size:14px;color:var(--text-secondary);margin:0 0 2px;">
              ₹{{ totalAmount() }} via <span style="font-weight:600;color:var(--text-primary);">{{ payMode }}</span>
            </p>

            @if (payResult()) {
              <div class="mt-3 mb-5 px-4 py-2.5 rounded-xl w-full"
                   style="background:var(--bg-secondary);border:1px solid var(--border);">
                <p style="font-size:10px;color:var(--text-secondary);margin:0 0 2px;text-transform:uppercase;letter-spacing:.06em;">Transaction ID</p>
                <p style="font-size:13px;font-weight:600;color:var(--text-primary);margin:0;font-family:monospace;">
                  {{ payResult()!.transactionId }}
                </p>
              </div>
            }

            <div class="flex gap-3 w-full mt-2" style="max-width:360px;">
              <button (click)="downloadReceipt()" [disabled]="receiptLoading()"
                      class="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                      style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);cursor:pointer;">
                @if (receiptLoading()) {
                  <svg class="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.2)" stroke-width="3"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  </svg>
                } @else {
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                  </svg>
                }
                {{ receiptLoading() ? 'Downloading…' : 'Download Receipt' }}
              </button>
              <button (click)="done.emit()"
                      class="flex-1 py-3 rounded-xl text-sm font-bold"
                      style="background:var(--accent);color:#fff;border:none;cursor:pointer;">
                Done
              </button>
            </div>
          </div>
        }

      </div>
    </div>
  `
})
export class DriverPaymentModalComponent implements OnInit {
  booking    = input.required<Booking>();
  storedCost = input<number>(0);
  closed = output<void>();
  done   = output<void>();

  private paySvc = inject(PaymentService);

  payMode: PaymentMode = 'CARD';

  payLoading     = signal(false);
  payError       = signal('');
  payResult      = signal<Payment | null>(null);
  isDone         = signal(false);
  receiptLoading = signal(false);

  totalAmount = computed(() => this.booking().totalFare ?? this.storedCost());

  payMethods: { id: PaymentMode; label: string; icon: string }[] = [
    { id: 'CARD',   label: 'Card',   icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
    { id: 'UPI',    label: 'UPI',    icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3' },
    { id: 'WALLET', label: 'Wallet', icon: 'M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3' },
    { id: 'CASH',   label: 'Cash',   icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
  ];

  ngOnInit() {
    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
    }
  }

  async submitPayment() {
    const booking = this.booking();
    this.payError.set('');

    if (this.payMode === 'CASH') {
      this.payLoading.set(true);
      this.paySvc.processPayment({
        bookingId:   booking.bookingId,
        lotId:       booking.lotId,
        amount:      this.totalAmount(),
        mode:        'CASH',
        description: `Parking booking #${booking.bookingId} — ${booking.spotNumber}`,
      }).subscribe({
        next: (payment: Payment) => {
          this.payResult.set(payment);
          this.isDone.set(true);
          this.payLoading.set(false);
        },
        error: err => {
          this.payError.set(err?.error?.message ?? 'Payment failed. Please try again.');
          this.payLoading.set(false);
        },
      });
      return;
    }

    this.payLoading.set(true);
    try {
      const order = await firstValueFrom(this.paySvc.createOrder({
        bookingId: booking.bookingId,
        amount: this.totalAmount(),
      }));

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'ParkEase',
        description: `Booking #${booking.bookingId} — ${booking.spotNumber}`,
        order_id: order.orderId,
        handler: (response: any) => {
          this.paySvc.processPayment({
            bookingId:           booking.bookingId,
            lotId:               booking.lotId,
            amount:              this.totalAmount(),
            mode:                this.payMode,
            description:         `Parking booking #${booking.bookingId} — ${booking.spotNumber}`,
            razorpayPaymentId:   response.razorpay_payment_id,
            razorpayOrderId:     response.razorpay_order_id,
            razorpaySignature:   response.razorpay_signature,
          }).subscribe({
            next: (payment: Payment) => {
              this.payResult.set(payment);
              this.isDone.set(true);
              this.payLoading.set(false);
            },
            error: err => {
              this.payError.set(err?.error?.message ?? 'Failed to record payment.');
              this.payLoading.set(false);
            },
          });
        },
        modal: {
          ondismiss: () => {
            this.payLoading.set(false);
          },
        },
        prefill: { name: 'ParkEase User' },
        theme: { color: '#1d9bf0' },
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        this.payError.set(response?.error?.description ?? 'Payment failed.');
        this.payLoading.set(false);
      });
      rzp.open();
    } catch (e: any) {
      this.payError.set(e?.message ?? 'Could not initiate payment. Please try again.');
      this.payLoading.set(false);
    }
  }

  downloadReceipt() {
    this.receiptLoading.set(true);
    this.paySvc.downloadReceipt(this.booking().bookingId).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-booking-${this.booking().bookingId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.receiptLoading.set(false);
      },
      error: () => this.receiptLoading.set(false),
    });
  }
}
