import { Component } from '@angular/core';
import { TripService } from 'src/app/services/trip.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent {

  allTripEvents = [];
  isLoading = true;
  vehicles: string[] = [];
  vehiclesForLive: any[] = []; // For live tab: includes trip filename + vin
  selectedVehicle: string | null = null;
  vehicleToTrip: Record<string, string> = {};
  // UI
  activeTab: 'live' | 'history' = 'live';
  displayMessage = 'Select Vehicle';

  constructor(private tripService: TripService) { }

  ngOnInit() {
    this.tripService.getAllVehicles().subscribe({
      next: (resp: any) => {
        // Response shape (example): { success: true, vehiclesByTrip: { tripId: ["VH_001"], ... } }
        const vehiclesByTrip = resp?.vehiclesByTrip ?? {};
        // Build a map from vehicle id -> trip filename
        this.vehicleToTrip = {};
        Object.entries(vehiclesByTrip).forEach(([tripKey, ids]) => {
          (ids as string[]).forEach((v) => {
            // If a vehicle appears in multiple trips, the last one wins; adjust if needed
            this.vehicleToTrip[v] = tripKey;
          });
        });
        // flatten all arrays of vehicle ids into one list and dedupe
        const all = (Object.values(vehiclesByTrip) as any[]).flat() as string[];
        this.vehicles = Array.from(new Set(all));

        // Build vehiclesForLive: array of { tripFilename, vin }
        this.vehiclesForLive = this.vehicles.map((vin) => ({
          vin: vin,
          tripFilename: this.vehicleToTrip[vin]
        })).filter((v) => v.tripFilename); // only include vehicles with a mapped trip

        console.log("this.vehicleToTrip", this.vehicleToTrip)
        console.log("this.vehicles", this.vehicles)
        console.log("this.vehiclesForLive", this.vehiclesForLive)

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load vehicles:', err);
        this.isLoading = true;
      }
    });


    // Use the function

  }

  selectTab(tabname: any) {
    this.activeTab = tabname;
  }
  onVehicleSelected(vin: string) {
    if (!vin) return;
    const tripFilename = this.vehicleToTrip[vin];
    if (!tripFilename) {
      console.warn('No trip filename found for vehicle', vin);
      return;
    }
    this.isLoading = true;
    this.displayMessage = 'Loading...'
    this.selectedVehicle = vin;
    // Pass the trip filename (e.g., 'trip_1_cross_country') to getTripsAllEvents
    this.tripService.getTripsAllEvents(tripFilename).subscribe({
      next: (tripDetails: any) => {
        console.log('Received trip events for trip file', tripFilename, tripDetails);
        this.allTripEvents = tripDetails?.data ?? [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load trip events for', tripFilename, err);
        this.allTripEvents = [];
        this.isLoading = false;
      }
    });
  }

}
