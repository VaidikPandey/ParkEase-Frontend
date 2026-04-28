import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vehicle } from '../models/parking.models';

export interface AddVehicleRequest {
  plate: string;
  vehicleType: string;
  ev: boolean;
  nickname?: string;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly API = '/api/v1/users/vehicles';

  constructor(private http: HttpClient) {}

  getMyVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.API);
  }

  addVehicle(req: AddVehicleRequest): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.API, req);
  }

  updateVehicle(vehicleId: number, req: Partial<AddVehicleRequest>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.API}/${vehicleId}`, req);
  }

  deleteVehicle(vehicleId: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${vehicleId}`);
  }

  getByPlate(plate: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.API}/plate/${plate}`);
  }
}
