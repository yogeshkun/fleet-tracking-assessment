import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TripService {
  private baseUrl = 'http://localhost:4000/api/trips';

  constructor(private http: HttpClient) {}

  getTrips(): Observable<string[]> {
    return this.http.get<string[]>(this.baseUrl);
  }

  getTripSummary(filename: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${filename}/summary`);
  }

  getTripDetails(filename: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${filename}`);
  }

  getTripsAllEvents(filename:string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/details/${filename}`);
  }

  getAllVehicles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vehicles`);
  }
}
