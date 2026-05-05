import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BookingService, CreateBookingRequest } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let http: HttpTestingController;

  const mockBooking = { bookingId: 1, status: 'CONFIRMED', spotId: 1 } as any;

  const createReq: CreateBookingRequest = {
    spotId: 1, lotId: 1, spotNumber: 'A1',
    bookingType: 'PRE_BOOKING',
    startTime: '2026-05-06T10:00', endTime: '2026-05-06T12:00',
    pricePerHour: 10, vehiclePlate: 'MH12AB1234',
    driverEmail: 'driver@test.com',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('createBooking() should POST to /api/v1/bookings', () => {
    service.createBooking(createReq).subscribe();
    const req = http.expectOne('/api/v1/bookings');
    expect(req.request.method).toBe('POST');
    req.flush(mockBooking);
  });

  it('getById() should GET the booking by id', () => {
    service.getById(1).subscribe(b => expect(b).toEqual(mockBooking));
    http.expectOne('/api/v1/bookings/1').flush(mockBooking);
  });

  it('getMyBookings() should GET /my', () => {
    service.getMyBookings().subscribe();
    http.expectOne('/api/v1/bookings/my').flush([mockBooking]);
  });

  it('checkIn() should PUT to checkin endpoint', () => {
    service.checkIn(1).subscribe();
    const req = http.expectOne('/api/v1/bookings/1/checkin');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockBooking, status: 'CHECKED_IN' });
  });

  it('checkOut() should PUT to checkout endpoint', () => {
    service.checkOut(1).subscribe();
    const req = http.expectOne('/api/v1/bookings/1/checkout');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockBooking, status: 'CHECKED_OUT' });
  });

  it('cancel() should PUT with default reason', () => {
    service.cancel(1).subscribe();
    const req = http.expectOne('/api/v1/bookings/1/cancel');
    expect(req.request.body).toEqual({ reason: 'CHANGE_OF_PLANS' });
    req.flush({ ...mockBooking, status: 'CANCELLED' });
  });

  it('extend() should PUT with newEndTime', () => {
    service.extend(1, '2026-05-06T14:00').subscribe();
    const req = http.expectOne('/api/v1/bookings/1/extend');
    expect(req.request.body).toEqual({ newEndTime: '2026-05-06T14:00' });
    req.flush(mockBooking);
  });

  it('getBookingsByLot() should GET manager lot endpoint', () => {
    service.getBookingsByLot(5).subscribe();
    http.expectOne('/api/v1/bookings/manager/lot/5').flush([]);
  });

  it('getAllBookings() should GET admin all endpoint', () => {
    service.getAllBookings().subscribe();
    http.expectOne('/api/v1/bookings/admin/all').flush([]);
  });

  it('forceCheckout() should PUT to admin force-checkout', () => {
    service.forceCheckout(1).subscribe();
    const req = http.expectOne('/api/v1/bookings/admin/1/force-checkout');
    expect(req.request.method).toBe('PUT');
    req.flush(mockBooking);
  });
});
