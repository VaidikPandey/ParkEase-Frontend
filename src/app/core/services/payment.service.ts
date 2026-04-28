import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment } from '../models/parking.models';

export type PaymentMode = 'CARD' | 'UPI' | 'WALLET' | 'CASH';

export interface ProcessPaymentRequest {
  bookingId: number;
  lotId: number;
  amount: number;
  mode: PaymentMode;
  description?: string;
}

export interface RefundRequest {
  bookingId: number;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly API = '/api/v1/payments';

  constructor(private http: HttpClient) {}

  processPayment(req: ProcessPaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.API, req);
  }

  getByBooking(bookingId: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.API}/booking/${bookingId}`);
  }

  getByUser(userId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.API}/user/${userId}`);
  }

  getStatus(paymentId: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.API}/${paymentId}/status`);
  }

  refund(req: RefundRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.API}/refund`, req);
  }

  downloadReceipt(bookingId: number): Observable<Blob> {
    return this.http.get(`${this.API}/booking/${bookingId}/receipt`, { responseType: 'blob' });
  }

  getLotRevenue(lotId: number): Observable<any> {
    return this.http.get(`${this.API}/admin/revenue/lot/${lotId}`);
  }

  getPlatformRevenue(from: string, to: string): Observable<any> {
    return this.http.get(`${this.API}/admin/revenue/platform`, { params: { from, to } });
  }

  getAllTimeRevenue(): Observable<any> {
    return this.http.get(`${this.API}/admin/revenue/platform/all`);
  }
}
