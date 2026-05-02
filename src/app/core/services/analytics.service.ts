import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RevenueReport, HourlyTraffic, UtilisationStats, DriverAnalytics } from '../models/parking.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly API = '/api/v1/analytics';

  constructor(private http: HttpClient) {}

  getRevenue(lotId: number, from: string, to: string): Observable<RevenueReport> {
    const params = new HttpParams()
      .set('lotId', lotId.toString())
      .set('from', from)
      .set('to', to);
    return this.http.get<RevenueReport>(`${this.API}/revenue`, { params });
  }

  getHourlyTraffic(lotId: number, from: string, to: string): Observable<HourlyTraffic[]> {
    const params = new HttpParams()
      .set('lotId', lotId.toString())
      .set('from', from)
      .set('to', to);
    return this.http.get<HourlyTraffic[]>(`${this.API}/traffic/hourly`, { params });
  }

  getUtilisation(lotId: number, from: string, to: string): Observable<UtilisationStats> {
    const params = new HttpParams()
      .set('lotId', lotId.toString())
      .set('from', from)
      .set('to', to);
    return this.http.get<UtilisationStats>(`${this.API}/utilisation`, { params });
  }

  getDriverAnalytics(from: string, to: string): Observable<DriverAnalytics> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to);
    return this.http.get<DriverAnalytics>(`${this.API}/my`, { params });
  }
}
