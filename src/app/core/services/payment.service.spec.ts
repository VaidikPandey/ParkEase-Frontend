import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PaymentService, ProcessPaymentRequest, RazorpayOrderRequest } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let http: HttpTestingController;

  const mockPayment = { paymentId: 1, bookingId: 10, amount: 100 } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('createOrder() should POST to create-order', () => {
    const req: RazorpayOrderRequest = { bookingId: 1, amount: 100 };
    service.createOrder(req).subscribe();
    const r = http.expectOne('/api/v1/payments/create-order');
    expect(r.request.method).toBe('POST');
    r.flush({ orderId: 'ord_1', amount: 100, currency: 'INR', keyId: 'key' });
  });

  it('processPayment() should POST to /api/v1/payments', () => {
    const req: ProcessPaymentRequest = {
      bookingId: 1, lotId: 2, amount: 100, mode: 'CARD',
    };
    service.processPayment(req).subscribe();
    const r = http.expectOne('/api/v1/payments');
    expect(r.request.method).toBe('POST');
    r.flush(mockPayment);
  });

  it('getByBooking() should GET payment by booking id', () => {
    service.getByBooking(10).subscribe(p => expect(p).toEqual(mockPayment));
    http.expectOne('/api/v1/payments/booking/10').flush(mockPayment);
  });

  it('getByUser() should GET payments by user id', () => {
    service.getByUser(5).subscribe();
    http.expectOne('/api/v1/payments/user/5').flush([mockPayment]);
  });

  it('refund() should POST to /api/v1/payments/refund', () => {
    service.refund({ bookingId: 10, reason: 'Cancelled' }).subscribe();
    const r = http.expectOne('/api/v1/payments/refund');
    expect(r.request.method).toBe('POST');
    r.flush(mockPayment);
  });

  it('getLotRevenue() should GET admin revenue for lot', () => {
    service.getLotRevenue(3).subscribe();
    http.expectOne('/api/v1/payments/admin/revenue/lot/3').flush({});
  });

  it('getPlatformRevenue() should GET with from/to params', () => {
    service.getPlatformRevenue('2026-01-01', '2026-12-31').subscribe();
    const r = http.expectOne(req => req.url === '/api/v1/payments/admin/revenue/platform');
    expect(r.request.params.get('from')).toBe('2026-01-01');
    r.flush({});
  });
});
