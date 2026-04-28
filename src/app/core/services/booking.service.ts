import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../models/parking.models';

export interface CreateBookingRequest {
  spotId: number;
  lotId: number;
  spotNumber: string;
  bookingType: 'PRE_BOOKING' | 'WALK_IN';
  startTime: string;
  endTime: string;
  pricePerHour: number;
  vehiclePlate: string;
  driverEmail: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly API = '/api/v1/bookings';

  constructor(private http: HttpClient) {}

  createBooking(req: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.API, req);
  }

  getById(bookingId: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.API}/${bookingId}`);
  }

  checkIn(bookingId: number): Observable<Booking> {
    return this.http.put<Booking>(`${this.API}/${bookingId}/checkin`, {});
  }

  checkOut(bookingId: number): Observable<Booking> {
    return this.http.put<Booking>(`${this.API}/${bookingId}/checkout`, {});
  }

  cancel(bookingId: number, reason = 'CHANGE_OF_PLANS'): Observable<Booking> {
    return this.http.put<Booking>(`${this.API}/${bookingId}/cancel`, { reason });
  }

  extend(bookingId: number, newEndTime: string): Observable<Booking> {
    return this.http.put<Booking>(`${this.API}/${bookingId}/extend`, { newEndTime });
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/my`);
  }

  getBookingsByLot(lotId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/manager/lot/${lotId}`);
  }

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/admin/all`);
  }

  forceCheckout(bookingId: number): Observable<Booking> {
    return this.http.put<Booking>(`${this.API}/admin/${bookingId}/force-checkout`, {});
  }
}
