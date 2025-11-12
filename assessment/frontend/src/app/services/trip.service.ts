import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TripService {
  // Keep endpoints relative — the HTTP interceptor will prepend environment.apiBase.
  // For clarity we keep the resource root for trips here.
  private resourceRoot = 'trips';

  constructor(private http: HttpClient) {}

  getTrips(): Observable<string[]> {
    return this.http.get<string[]>(`${this.resourceRoot}`);
  }

  getTripSummary(filename: string): Observable<any> {
    return this.http.get<any>(`${this.resourceRoot}/${filename}/summary`);
  }

  getTripDetails(filename: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.resourceRoot}/${filename}`);
  }

  getTripsAllEvents(filename: string): Observable<any[]> {
    return this.http.get<any[]>(`/${this.resourceRoot}/details/${filename}`);
  }

  getAllVehicles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.resourceRoot}/vehicles`);
  }

  // expose base if other services need it (backwards compatibility)
  get baseUrl(): string {
    return `${environment.apiBase}/${this.resourceRoot}`;
  }
}
