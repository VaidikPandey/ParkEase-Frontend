import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, shareReplay } from 'rxjs';
import { ParkingSpot, ParkingLot, LotAvailability, DashboardStats } from '../models/parking.models';

@Injectable({ providedIn: 'root' })
export class ParkingService {
  private readonly PARKING = '/api/v1/parking';

  selectedLotId = signal<number>(1);

  constructor(private http: HttpClient) {}

  // ── Lots ──────────────────────────────────────────────────────────
  getLots(): Observable<ParkingLot[]> {
    return this.http.get<ParkingLot[]>(`${this.PARKING}/admin/lots/all`);
  }

  getApprovedLots(city?: string): Observable<ParkingLot[]> {
    const params: Record<string, string> = {};
    if (city) params['city'] = city;
    return this.http.get<ParkingLot[]>(`${this.PARKING}/lots/search`, { params });
  }

  getNearbyLots(lat: number, lng: number, radius: number = 5): Observable<ParkingLot[]> {
    return this.http.get<ParkingLot[]>(`${this.PARKING}/lots/nearby`, {
      params: { lat, lng, radius }
    });
  }

  getLot(id: number): Observable<ParkingLot> {
    return this.http.get<ParkingLot>(`${this.PARKING}/lots/${id}`);
  }

  getManagerLots(): Observable<ParkingLot[]> {
    return this.http.get<ParkingLot[]>(`${this.PARKING}/manager/lots`);
  }

  getPendingLots(): Observable<ParkingLot[]> {
    return this.http.get<ParkingLot[]>(`${this.PARKING}/admin/lots/pending`);
  }

  approveLot(id: number): Observable<ParkingLot> {
    return this.http.put<ParkingLot>(`${this.PARKING}/admin/lots/${id}/approve`, {});
  }

  rejectLot(id: number): Observable<ParkingLot> {
    return this.http.put<ParkingLot>(`${this.PARKING}/admin/lots/${id}/reject`, {});
  }

  createLot(body: Partial<ParkingLot>): Observable<ParkingLot> {
    return this.http.post<ParkingLot>(`${this.PARKING}/manager/lots`, body);
  }

  updateLot(id: number, body: Partial<ParkingLot>): Observable<ParkingLot> {
    return this.http.put<ParkingLot>(`${this.PARKING}/manager/lots/${id}`, body);
  }

  toggleLot(id: number): Observable<ParkingLot> {
    return this.http.put<ParkingLot>(`${this.PARKING}/manager/lots/${id}/toggle`, {});
  }

  // ── Spots ─────────────────────────────────────────────────────────
  getSpots(lotId: number): Observable<ParkingSpot[]> {
    return this.http.get<ParkingSpot[]>(`${this.PARKING}/lots/${lotId}/spots`);
  }

  getAvailableSpots(lotId: number): Observable<ParkingSpot[]> {
    return this.http.get<ParkingSpot[]>(`${this.PARKING}/lots/${lotId}/spots/available`);
  }

  getAvailability(lotId: number): Observable<LotAvailability> {
    return this.http.get<LotAvailability>(`${this.PARKING}/lots/${lotId}/availability`);
  }

  getSpotsByType(lotId: number, type: string): Observable<ParkingSpot[]> {
    return this.http.get<ParkingSpot[]>(`${this.PARKING}/lots/${lotId}/spots/type/${type}`);
  }

  getSpotById(spotId: number): Observable<ParkingSpot> {
    return this.http.get<ParkingSpot>(`${this.PARKING}/spots/${spotId}`);
  }

  createSpot(lotId: number, body: Partial<ParkingSpot>): Observable<ParkingSpot> {
    return this.http.post<ParkingSpot>(`${this.PARKING}/manager/lots/${lotId}/spots`, body);
  }

  bulkCreateSpots(lotId: number, spots: Partial<ParkingSpot>[]): Observable<ParkingSpot[]> {
    return this.http.post<ParkingSpot[]>(`${this.PARKING}/manager/lots/${lotId}/spots/bulk`, { spots });
  }

  updateSpot(spotId: number, body: Partial<ParkingSpot>): Observable<ParkingSpot> {
    return this.http.put<ParkingSpot>(`${this.PARKING}/manager/spots/${spotId}`, body);
  }

  deleteSpot(spotId: number): Observable<void> {
    return this.http.delete<void>(`${this.PARKING}/manager/spots/${spotId}`);
  }

  // ── Polling ───────────────────────────────────────────────────────
  pollSpots(lotId: number): Observable<ParkingSpot[]> {
    return interval(15000).pipe(
      startWith(0),
      switchMap(() => this.getSpots(lotId)),
      shareReplay(1)
    );
  }

  pollAvailability(lotId: number): Observable<LotAvailability> {
    return interval(15000).pipe(
      startWith(0),
      switchMap(() => this.getAvailability(lotId)),
      shareReplay(1)
    );
  }

  getDashboardStats(spots: ParkingSpot[]): DashboardStats {
    const total     = spots.length;
    const available = spots.filter(s => s.status === 'AVAILABLE').length;
    const reserved  = spots.filter(s => s.status === 'RESERVED').length;
    const occupied  = spots.filter(s => s.status === 'OCCUPIED').length;
    return {
      totalSpots:     total,
      availableSpots: available,
      occupiedSpots:  occupied,
      reservedSpots:  reserved,
      occupancyRate:  total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0
    };
  }
}
