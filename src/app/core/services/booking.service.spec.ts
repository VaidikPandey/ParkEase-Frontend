import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let http: HttpTestingController;

  const mockBooking = { bookingId: 1, status: 'CONFIRMED' } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getMyBookings() should GET /api/v1/bookings/my', () => {
    service.getMyBookings().subscribe();
    http.expectOne('/api/v1/bookings/my').flush([mockBooking]);
  });

  it('checkIn() should PUT to the checkin endpoint', () => {
    service.checkIn(1).subscribe();
    const req = http.expectOne('/api/v1/bookings/1/checkin');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockBooking, status: 'CHECKED_IN' });
  });

  it('cancel() should PUT with the cancellation reason', () => {
    service.cancel(1, 'CHANGE_OF_PLANS').subscribe();
    const req = http.expectOne('/api/v1/bookings/1/cancel');
    expect(req.request.body).toEqual({ reason: 'CHANGE_OF_PLANS' });
    req.flush({ ...mockBooking, status: 'CANCELLED' });
  });

  it('extend() should PUT with the new end time', () => {
    service.extend(1, '2026-05-06T14:00').subscribe();
    const req = http.expectOne('/api/v1/bookings/1/extend');
    expect(req.request.body).toEqual({ newEndTime: '2026-05-06T14:00' });
    req.flush(mockBooking);
  });
});
