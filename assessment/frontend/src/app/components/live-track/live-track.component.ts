import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { LiveService } from 'src/app/services/live.service';
import { Subscription, Observable } from 'rxjs';
import { CustomOverlay } from 'src/assets/events/custom-overlay';

@Component({
  selector: 'app-live-track',
  templateUrl: './live-track.component.html',
  styleUrls: ['./live-track.component.scss']
})
export class LiveTrackComponent implements OnInit, OnDestroy, OnChanges {
  // receive vehicle details from parent (includes trip filename and vin)
  @Input() vehiclesFromParent: any[] = [];
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

  vehicles: any[] = [];
  vehicleMarkers: Record<string, { position: google.maps.LatLngLiteral; label?: string; icon?: any }> = {};
  // Per-vehicle custom overlays (uses the same overlay used in track-tracing)
  customOverlays: Record<string, CustomOverlay> = {};
  vehicleData: Record<string, { lat: number; lng: number; speed?: number; heading?: number; timestamp?: string }> = {};
  selectedVehicleId: string | null = null;
  firstVehicleReceived: string | null = null; // Track the first vehicle to center on
  subscriptions: Subscription[] = [];
  subscribedIds: Set<string> = new Set();
  center: google.maps.LatLngLiteral = { lat: 22.7230144, lng: 86.3884608 };
  zoom = 6;

  constructor(private liveService: LiveService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // If parent already passed vehicles synchronously, start subscriptions
    if (this.vehiclesFromParent && this.vehiclesFromParent.length) {
      this.handleVehicleListChange(this.vehiclesFromParent);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehiclesFromParent'] && !changes['vehiclesFromParent'].isFirstChange()) {
      this.handleVehicleListChange(changes['vehiclesFromParent'].currentValue || []);
    }
  }

  get vehicleKeys(): string[] {
    // Expose keys for vehicles that have overlays (hide default map markers)
    return Object.keys(this.customOverlays || {});
  }

  private handleVehicleListChange(list: any[]) {
    this.vehicles = list || [];
    // subscribe to streams for each vehicle (tripFilename and vin expected on each object)
    // Stagger subscriptions to avoid browser connection limit issues (browsers limit ~6 parallel connections)
    this.vehicles.forEach((v: any, index: number) => {
      setTimeout(() => {
        this.subscribeVehicleStream(v);
      }, index * 200); // 200ms delay between each subscription
    });
  }

  private subscribeVehicleStream(v: any) {
    const trip = (v?.tripFilename ?? v?.trip) || v?.trip_id || v?.tripName;
    const id = v?.vin ?? v?.vehicle_id ?? v?.id;
    if (!id || !trip) return;
    if (this.subscribedIds.has(`${trip}::${id}`)) return; // already subscribed

    this.subscribedIds.add(`${trip}::${id}`);

    const obs: Observable<any> = this.liveService.subscribeToVehicleStream(trip, id);
    const s = obs.subscribe({
      next: (msg: any) => this.handleLiveMessage(id, msg),
      error: (err) => console.warn(`Stream error for ${id}`, err),
      complete: () => console.log(`Stream completed for ${id}`)
    });
    this.subscriptions.push(s);
  }

  handleLiveMessage(id: string, msg: any) {
    // Expect msg to contain lat, lng, speed, heading etc. Adapt to your backend shape.
    const lat = msg.location?.lat ?? msg.lat ?? msg.latitude;
    const lng = msg.location?.lng ?? msg.lng ?? msg.longitude;
    const speed = msg.movement?.speed_kmh ?? msg.speed ?? null;
    const heading = msg.movement?.heading_degrees ?? msg.heading ?? 0;
    const timestamp = msg.timestamp ?? msg.eventDateTime ?? new Date().toISOString();

    if (lat == null || lng == null) return;

    // Store vehicle data for display in sidebar
    this.vehicleData[id] = {
      lat: +lat,
      lng: +lng,
      speed: speed ? +speed : undefined,
      heading: heading ? +heading : 0,
      timestamp: timestamp
    };
    console.log("vehicleData from subscibe ", this.vehicleData)
    // Trigger change detection so template re-renders and isVehicleAvailable() is called
    this.cdr.markForCheck();
    // Use a CustomOverlay (same style as track-tracing) to render a rotated truck image
    try {
      const mapInstance = this.map?.googleMap as google.maps.Map | undefined;
      if (mapInstance) {
        if (!this.customOverlays[id]) {
          const overlayOptions: any = {
            image: '/assets/truck.svg',
            position: { lat: +lat, lng: +lng },
            angle: heading ?? 0,
            path: [{ lat: +lat, lng: +lng, degree: heading ?? 0, vehicleSpeed: speed ?? 0, eventDateTime: timestamp }],
            isSmoothReCenter: false,
            isSmoothTurn: false,
            speed: 1,
            width: '36px',
            height: '58px',
            marginLeft: '-17px',
            marginTop: '-30px',
            zIndex: 1000,
            isLabel: false
          };
          const overlay = new CustomOverlay(overlayOptions);
          overlay.setMap(mapInstance);
          // Ensure initial rotation/position set
          overlay.setAngle(heading ?? 0);
          overlay.setPosition({ lat: +lat, lng: +lng, vehicleSpeed: speed ?? 0, eventDateTime: timestamp });
          this.customOverlays[id] = overlay;
        } else {
          // Update existing overlay
          const overlay = this.customOverlays[id];
          overlay.setPosition({ lat: +lat, lng: +lng, vehicleSpeed: speed ?? 0, eventDateTime: timestamp });
          overlay.setAngle(heading ?? 0);
        }
      }
    } catch (e) {
      console.warn('Failed to create/update custom overlay for', id, e);
    }

    // On first vehicle data: center on it and store as first vehicle
    const mapInstance = this.map?.googleMap as any;
    if (!this.firstVehicleReceived) {
      this.firstVehicleReceived = id;
      // Auto-select the first vehicle that sends data so the list reflects the centered vehicle
      if (!this.selectedVehicleId) {
        this.selectedVehicleId = id;
      }
      if (mapInstance && typeof mapInstance.setCenter === 'function') {
        mapInstance.setCenter({ lat: +lat, lng: +lng });
      } else {
        this.center = { lat: +lat, lng: +lng };
      }
    }
    // Keep the first (or selected) vehicle centered
    else if (this.selectedVehicleId === id) {
      // Selected vehicle: center on it as it updates (use direct map API to avoid binding conflicts)
      if (mapInstance && typeof mapInstance.setCenter === 'function') {
        mapInstance.setCenter({ lat: +lat, lng: +lng });
      } else {
        this.center = { lat: +lat, lng: +lng };
      }
    }
    else if (this.selectedVehicleId === null && this.firstVehicleReceived === id) {
      // No vehicle selected: keep centering on the first vehicle that sent data
      if (mapInstance && typeof mapInstance.setCenter === 'function') {
        mapInstance.setCenter({ lat: +lat, lng: +lng });
      } else {
        this.center = { lat: +lat, lng: +lng };
      }
    }
  }

  selectVehicle(vehicleId: string) {
    this.selectedVehicleId = vehicleId;
    // Immediately center on selected vehicle if we have its data and zoom in
    if (this.vehicleData[vehicleId]) {
      const lat = this.vehicleData[vehicleId].lat;
      const lng = this.vehicleData[vehicleId].lng;
      this.center = { lat, lng };
      // zoom in to a closer level for selected vehicle
      this.zoom = 16;

      // Directly pan and zoom the map (avoid overlay-driven pan to prevent conflicts)
      try {
        const mapInstance = this.map?.googleMap as any;
        if (mapInstance) {
          if (typeof mapInstance.panTo === 'function') {
            mapInstance.panTo({ lat, lng });
          } else if (typeof mapInstance.setCenter === 'function') {
            mapInstance.setCenter({ lat, lng });
          }
          if (typeof mapInstance.setZoom === 'function') {
            mapInstance.setZoom(this.zoom);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  get selectedVehicleInfo() {
    if (!this.selectedVehicleId || !this.vehicleData[this.selectedVehicleId]) {
      return null;
    }
    return this.vehicleData[this.selectedVehicleId];
  }

  isVehicleAvailable(vehicleId: string): boolean {
    const available = this.vehicleData[vehicleId] != null;
    console.log(`isVehicleAvailable(${vehicleId}):`, available, this.vehicleData);
    return available;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s && s.unsubscribe && s.unsubscribe());
    this.subscriptions = [];
    // Remove any custom overlays we've created
    try {
      Object.keys(this.customOverlays || {}).forEach((id) => {
        try {
          const ov = this.customOverlays[id];
          if (ov) {
            ov.RemoveMarker && ov.RemoveMarker();
            ov.setMap && ov.setMap(null);
          }
        } catch (err) {}
      });
    } catch (e) {}
  }
}
