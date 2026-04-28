import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RevenueReport, HourlyTraffic, UtilisationStats } from '../models/parking.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly API = '/api/v1/analytics';

  constructor(private http: HttpClient) {}

  getRevenue(lotId: number, from: string, to: string): Observable<RevenueReport> {
    return this.http.get<RevenueReport>(`${this.API}/revenue`, {
      params: { lotId, from, to }
    });
  }

  getHourlyTraffic(lotId: number, from: string, to: string): Observable<HourlyTraffic[]> {
    return this.http.get<HourlyTraffic[]>(`${this.API}/traffic/hourly`, {
      params: { lotId, from, to }
    });
  }

  getUtilisation(lotId: number, from: string, to: string): Observable<UtilisationStats> {
    return this.http.get<UtilisationStats>(`${this.API}/utilisation`, {
      params: { lotId, from, to }
    });
  }
}
