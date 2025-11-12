import { Component } from '@angular/core';
import { TripService } from './services/trip.service';
import { GoogleMap, MapPolyline } from '@angular/google-maps';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  // standalone : true,
  // imports : [GoogleMap,MapPolyline]
})
export class AppComponent {
  title = 'frontend';
  trips: string[] = [];
  selectedSummary: any = null;
  loading = false;
  tripEvents = [];

  constructor(private tripService: TripService) {}

  ngOnInit() {
    this.tripService.getTrips().subscribe({
      next: (data) => (this.trips = data),
      error: (err) => console.error('Failed to load trips:', err)
    });
  }

  loadSummary(filename: string) {
    this.loading = true;
    this.tripService.getTripSummary(filename).subscribe({
      next: (summary) => {
        this.selectedSummary = summary;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load summary:', err);
        this.loading = false;
      }
    });
  }
}
