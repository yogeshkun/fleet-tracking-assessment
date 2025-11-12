import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { TripService } from 'src/app/services/trip.service';
import { CustomOverlay, OverlayOptions } from 'src/assets/events/custom-overlay';

@Component({
  selector: 'app-track-tracing',
  templateUrl: './track-tracing.component.html',
  styleUrls: ['./track-tracing.component.scss']
})
export class TrackTracingComponent {

  @Input() allTripEvents = [];
  center: google.maps.LatLngLiteral = { lat: 22.7230144, lng: 86.3884608 };
  zoom = 11;
  latLngArray!: { lat: number; lng: number; degree: number; vehicleSpeed?: number; eventDateTime?: string }[];
  data: any = [];
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  @ViewChild('progressBar', { static: false }) progressBarRef!: ElementRef<HTMLDivElement>;
  polylineOptions: google.maps.PolylineOptions = {
    path: this.latLngArray,
    geodesic: true,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2,
  };
  polyline!: google.maps.Polyline;
  isPaused: any = false;
  isAnimating: any = false;
  animationFrameId: any;
  currentIndex = 0; // Track the current index in the path
  currentAnimationFraction = 0; // Track the animation progress between points
  speed = 1.0;
  customOverlay!: CustomOverlay;
  currentAngle = 0;
  isLoading = true;
  positionChangedListener!: (data: any) => void;
  tripSummary: any = null;
  stoppagePoints: any[] = [];
  stoppageCount = 0;
  insights: any = null;
  progressPercentage = 0; // Track trip progress (0-100)
  isDraggingProgressBar = false; // Track if user is dragging progress bar
  // Tooltip / hover properties for the progress bar
  showProgressTooltip = false;
  progressHoverTimestamp: string = '';
  hoverLeft = 0;
  private _docMouseMove: any = null;
  private _docMouseUp: any = null;
  STOPPAGE_SVG_HTML = `<svg width="30" height="30" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8.69117 -0.00390625H16.6128C17.3621 -0.00390625 18.0811 0.292174 18.6129 0.817867L24.5405 6.70925C25.0722 7.23494 25.3683 7.94795 25.3683 8.69722V16.5947C25.3683 17.3379 25.0722 18.057 24.5405 18.5827L18.5222 24.5586C17.9965 25.0783 17.2775 25.3744 16.5282 25.3744H8.67305C7.92378 25.3744 7.20473 25.0783 6.673 24.5526L0.823909 18.7458C0.292174 18.2141 -0.00390625 17.5011 -0.00390625 16.7578V8.76973C-0.00390625 8.03859 0.286131 7.33162 0.799739 6.80593L6.66695 0.842036C7.20473 0.298216 7.92982 -0.00390625 8.69117 -0.00390625Z" fill="#C7222A"/>
  <path d="M2.37304 9.81363C2.46288 9.0632 3.6044 8.92579 4.14344 9.338C4.40768 9.5494 4.12759 9.88762 3.89506 9.71851C3.6044 9.53883 2.94908 9.44898 2.86981 9.85591C2.76412 10.4901 4.46053 10.1254 4.43411 11.156C4.40768 12.1389 2.97022 12.1654 2.43118 11.7214C2.30434 11.6157 2.30434 11.4466 2.37833 11.3409C2.47874 11.2405 2.595 11.2035 2.72712 11.3145C3.04421 11.5312 3.86864 11.695 3.92677 11.1454C3.87921 10.5694 2.25149 10.9129 2.37304 9.81363Z" fill="white"/>
  <path d="M5.61647 9.71552H4.92945C4.59122 9.71552 4.59122 9.21875 4.92945 9.21875H6.77384C7.12263 9.21875 7.12263 9.71552 6.77384 9.71552H6.1291V11.6709C6.1291 12.0091 5.61647 12.0144 5.61647 11.6709V9.71552Z" fill="white"/>
  <path d="M8.62737 11.9496C7.90336 11.9813 7.1582 11.5057 7.1582 10.5544C7.1582 9.60316 7.90864 9.13281 8.62737 9.13281C9.30911 9.16981 10.0226 9.63487 10.0226 10.5544C10.0226 11.474 9.30911 11.9496 8.62737 11.9496ZM8.58509 9.64015C8.14646 9.64015 7.67083 9.94667 7.67083 10.5597C7.67083 11.1675 8.14646 11.4793 8.58509 11.4793C9.0343 11.4793 9.51522 11.1675 9.51522 10.5597C9.51522 9.94667 9.0343 9.64015 8.58509 9.64015Z" fill="white"/>
  <path d="M10.5078 9.46484C10.5078 9.338 10.6082 9.19531 10.7721 9.19531H11.6757C12.1831 9.19531 12.6376 9.53354 12.6376 10.1783C12.6376 10.7913 12.1831 11.1295 11.6757 11.1295H11.0257V11.6422C11.0257 11.8113 10.9147 11.9117 10.7773 11.9117C10.6505 11.9117 10.5131 11.8166 10.5131 11.6422V9.46484H10.5078ZM11.0204 9.6868V10.6539H11.6705C11.9294 10.6539 12.1408 10.4267 12.1408 10.1836C12.1408 9.91404 11.9347 9.6868 11.6705 9.6868H11.0204Z" fill="white"/>
  <path d="M13.0547 9.46484C13.0547 9.338 13.1551 9.19531 13.3189 9.19531H14.2226C14.73 9.19531 15.1845 9.53354 15.1845 10.1783C15.1845 10.7913 14.73 11.1295 14.2226 11.1295H13.5726V11.6422C13.5726 11.8113 13.4616 11.9117 13.3242 11.9117C13.1974 11.9117 13.06 13.0666 13.06 11.6422V9.46484H13.0547ZM13.5673 9.6868V10.6539H14.2173C14.4763 10.6539 14.6877 10.4267 14.6877 10.1836C14.6877 9.91404 14.4816 9.6868 14.2173 9.6868H13.5673Z" fill="white"/>
  <path d="M15.545 11.9134C15.4181 11.8447 15.3441 11.702 15.4181 11.5435L16.5385 9.37141C16.6442 9.16531 16.9243 9.16002 17.0247 9.37141L18.1239 11.5435C18.2825 11.8447 17.8121 12.0878 17.6694 11.7813L17.5003 11.4378H16.0629L15.8937 11.7813C15.825 11.9134 15.6824 11.9398 15.545 11.9134ZM17.2202 10.9304L16.7816 9.97388L16.3007 10.9304H17.2202Z" fill="white"/>
  <path d="M20.7725 11.6148C20.4976 11.8421 20.1541 11.9425 19.8106 11.9425C18.9915 11.9425 18.4102 11.4774 18.4102 10.5579C18.4102 9.77572 19.0232 9.16797 19.8476 9.16797C20.1541 9.16797 20.4976 9.27366 20.7355 9.50619C20.9733 9.73872 20.6298 10.0822 20.3972 9.87613C20.2545 9.73873 20.0484 9.63303 19.8476 9.63303C19.3773 9.63303 18.9175 10.0082 18.9175 10.5526C18.9175 11.1286 19.298 11.4721 19.8106 11.4721C20.0484 11.4721 20.2493 11.4034 20.3972 11.2977V10.8221H19.8106C19.4618 10.8221 19.4988 10.3518 19.8106 10.3518H20.5928C20.7355 10.3518 20.8676 10.4627 20.8676 10.579V11.4034C20.8729 11.4721 20.8412 11.5408 20.7725 11.6148Z" fill="white"/>
  <path d="M21.6708 11.9124C21.5334 11.9124 21.4277 11.8067 21.4277 11.6746V9.4761C21.4277 9.33869 21.5334 9.23828 21.6708 9.23828H23.0713C23.4307 9.23828 23.4201 9.74034 23.0713 9.74034H21.9456V10.3217H22.9286C23.2774 10.3217 23.2774 10.829 22.9286 10.829H21.9456V11.4103H23.1347C23.4888 11.4103 23.5152 11.9177 23.1347 11.9177L21.6708 11.9124Z" fill="white"/>
  </svg>`;
  stoppageIcon: any = null;

  constructor(private tripService: TripService) {}

  extractLatLng(dataArray: any[]): { lat: number; lng: number, degree: number, vehicleSpeed?: number, eventDateTime?: string }[] {
    return dataArray.map((entry) => ({
      lat: entry.location.lat,
      lng: entry.location.lng,
      degree: entry?.movement?.heading_degrees || 0,
      vehicleSpeed: entry?.movement?.speed_kmh ?? null,
      eventDateTime: entry.timestamp || entry.time || entry.event_time || null
    }));
  }

  ngOnInit() {
    // this.tripService.getTripsAllEvents('trip_1_cross_country').subscribe({
    //   next: (tripDetails: any) => {
    //     console.log("Recieved API details ", tripDetails)
        this.data = this.allTripEvents;
        this.latLngArray = this.extractLatLng(this.data);
        // console.log(this.latLngArray);
        this.polylineOptions.path = this.latLngArray;
    this.isLoading = false;
    // Compute a trip summary for the sidebar
    this.computeTripSummary();
  this.computeStoppages();
  this.computeInsights();
    //   },
    //   error: (err) => {
    //     console.error('Failed to load summary:', err);
    //     this.isLoading = true;
    //   }
    // });
    // // Use the function

  }

  private computeStoppages() {
    if (!this.data || this.data.length === 0) {
      this.stoppagePoints = [];
      this.stoppageCount = 0;
      return;
    }
    // Accept both `stoppage` and `overspeed` as flags depending on your event shape
    const raw = this.data.filter((e: any) => e.stoppage === true || e.overspeed === true || e.isStoppage === true);
    this.stoppageCount = raw.length;

    // Group stoppages by exact lat/lng to aggregate counts per location
    const groups: Record<string, { lat: number; lng: number; count: number; items: any[] }> = {};
    raw.forEach((e: any) => {
      const lat = e.location?.lat ?? e.lat;
      const lng = e.location?.lng ?? e.lng;
      if (lat == null || lng == null) return;
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      if (!groups[key]) groups[key] = { lat, lng, count: 0, items: [] };
      groups[key].count += 1;
      groups[key].items.push(e);
    });

    // Build stoppagePoints array with icon per group using the plain stoppage SVG (no embedded count)
    this.stoppagePoints = Object.keys(groups).map((k) => {
      const g = groups[k];
      // Use the plain SVG (no count overlay) as the marker icon
      const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(this.STOPPAGE_SVG_HTML);
      // Use the svg data URL directly as the marker icon (string). This ensures Angular
      // Google Maps uses the image and avoids rendering a default marker.
      return {
        location: { lat: g.lat, lng: g.lng },
        count: g.count,
        items: g.items,
        icon: svgUrl
      };
    });
  }

  private formatTimestamp(ts?: string) {
    if (!ts) return '-';
    const d = new Date(ts);
    // Convert to local formatted string (e.g., 08:00 AM, 03 Nov 25)
    const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
    return `${timePart}, ${datePart}`;
  }

  private haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon), Math.sqrt(1 - (sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon)));
    return R * c;
  }

  private computeTotalDistanceFromPath(path: { lat: number; lng: number }[]) {
    if (!path || path.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      total += this.haversineKm(path[i], path[i + 1]);
    }
    return total;
  }

  private computeTripSummary() {
    if (!this.data || this.data.length === 0) return;
    const first = this.data[0];
    const last = this.data[this.data.length - 1];
    const startTime = first.timestamp || first.time || first.event_time || null;
    const endTime = last.timestamp || last.time || last.event_time || null;

    // prefer server-provided total_distance_km if available
    const totalDistance = last.total_distance_km ?? last.total_distance ?? this.computeTotalDistanceFromPath(this.latLngArray || []);

    const durationHours = startTime && endTime ? (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60) : null;

    this.tripSummary = {
      tripId: first.trip_id ?? last.trip_id ?? '-',
      vehicleId: first.vehicle_id ?? last.vehicle_id ?? '-',
      startTime: this.formatTimestamp(startTime),
      endTime: this.formatTimestamp(endTime),
      durationHours: durationHours != null ? +durationHours.toFixed(2) : '-',
      totalDistanceKm: totalDistance != null ? +(+totalDistance).toFixed(2) : '-',
      startLocation: first.location ? `${first.location.lat.toFixed(5)}, ${first.location.lng.toFixed(5)}` : '-',
      endLocation: last.location ? `${last.location.lat.toFixed(5)}, ${last.location.lng.toFixed(5)}` : '-',
    };
  }

  private computeInsights() {
    if (!this.data || this.data.length === 0) {
      this.insights = null;
      return;
    }

    const first = this.data[0];
    const last = this.data[this.data.length - 1];
    const startTime = first.timestamp || first.time || first.event_time || null;
    const endTime = last.timestamp || last.time || last.event_time || null;

    // Total Kilometers: use distance_travelled_km summed, or haversine fallback
    let totalKm = 0;
    this.data.forEach((e: any) => {
      totalKm += e.distance_travelled_km ?? 0;
    });
    if (totalKm === 0) {
      totalKm = this.computeTotalDistanceFromPath(this.latLngArray || []);
    }

    // Total Running Hours: compute from start and end times
    let totalRunningHours = 0;
    if (startTime && endTime) {
      totalRunningHours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    }

    // Total Energy Consumed: sum from device.battery_level drop or use fuel_consumed_percent
    let energyConsumed = last.fuel_consumed_percent ?? last.energy_consumed_percent ?? 0;

    // Total Stoppages: already computed
    const totalStoppages = this.stoppageCount;

    // Average Speed: sum all speeds and divide by count
    let totalSpeed = 0;
    let speedCount = 0;
    this.data.forEach((e: any) => {
      const speed = e.movement?.speed_kmh ?? 0;
      if (speed > 0) {
        totalSpeed += speed;
        speedCount += 1;
      }
    });
    const averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

    this.insights = {
      totalKilometers: totalKm.toFixed(2),
      totalRunningHours: totalRunningHours.toFixed(2),
      totalEnergyConsumed: energyConsumed.toFixed(2),
      totalStoppages: totalStoppages,
      averageSpeed: averageSpeed.toFixed(2)
    };
  }

  ngAfterViewInit(): void {
    const mapInstance = this.map.googleMap;
    if (mapInstance) {
      // Create and add the custom overlay
      const customOverlayOptions  : any = {
        image : '/assets/truck.svg',
        position : { lat: this.latLngArray[0].lat, lng: this.latLngArray[0].lng },
        angle : this.latLngArray[0].degree,
        path : this.latLngArray,
        isSmoothReCenter : true,
        isSmoothTurn : true,
        speed : 1,
        width:'36px',
        height :'58px',
        marginLeft : '-17px',
        marginTop : '-30px'

      }

      const angle = this.latLngArray[0].degree; // Rotate by 45 degrees
      this.center = customOverlayOptions.position
      this.customOverlay = new CustomOverlay(customOverlayOptions);
      this.customOverlay.setMap(mapInstance);
      this.customOverlay.setAngle(angle);


    }
    this.initPolyline();
  }

  initPolyline() {
    // Use type assertion to ensure googleMap is not undefined
    const mapInstance = this.map.googleMap as google.maps.Map;
    this.polyline = new google.maps.Polyline(this.polylineOptions);
    this.polyline.setMap(mapInstance);


    this.positionChangedListener = (data) => {
      console.log('Position changed:', data);
      // Update progress percentage based on current index
      if (this.latLngArray && this.latLngArray.length > 0) {
        this.progressPercentage = (this.customOverlay.getCurrentIndex() / (this.latLngArray.length - 1)) * 100;
      }
      // const position = this.customOverlay.getPosition()
      // this.customOverlay.smoothPanTo(position);

  };

  // Subscribe to the event
  this.customOverlay.on('positionChanged', this.positionChangedListener);
  }

  startVehicleAnimation() {
    if (this.customOverlay && typeof this.customOverlay.startAnimation === 'function') {
      this.customOverlay.startAnimation();
      this.isAnimating = true;
      this.isPaused = false;
    }
  }


  pauseAnimation() {
    if (this.customOverlay && typeof this.customOverlay.pauseAnimation === 'function') {
      this.customOverlay.pauseAnimation();
      this.isPaused = true;
    }
  }

  resumeAnimation() {
    if (this.customOverlay && typeof this.customOverlay.resumeAnimation === 'function') {
      this.customOverlay.resumeAnimation();
      this.isPaused = false;
      this.isAnimating = true;
    }
  }

  togglePauseResume() {
    // If animation hasn't been started, do nothing
    if (!this.isAnimating) return;
    if (this.isPaused) {
      this.resumeAnimation();
    } else {
      this.pauseAnimation();
    }
  }

  setSpeed(speed: any) {
    // Only allow fixed speed multipliers: 1, 5, 10
    const allowed = [1, 5, 10];
    const s = Number(speed) || 1;
    const chosen = allowed.includes(s) ? s : 1;
    this.speed = chosen;
    if (this.customOverlay && typeof this.customOverlay.setSpeed === 'function') {
      this.customOverlay.setSpeed(this.speed);
    }
  }

  reset(){
    if (this.customOverlay && typeof this.customOverlay.reset === 'function') {
      this.customOverlay.reset();
    }
    this.isAnimating = false;
    this.isPaused = false;
    this.progressPercentage = 0;
  }

  onProgressBarClick(event: MouseEvent) {
    if (!this.latLngArray || this.latLngArray.length === 0) {
      return;
    }

    // Calculate clicked percentage based on click position
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;

    // Calculate the index based on percentage
    const index = (percentage / 100) * (this.latLngArray.length - 1);

    // Seek to the position
    if (this.customOverlay && typeof this.customOverlay.seekToIndex === 'function') {
      this.customOverlay.seekToIndex(index);
      this.progressPercentage = percentage;
    }
  }

  onProgressBarMouseMove(event: MouseEvent) {
    if (!this.latLngArray || this.latLngArray.length === 0) return;

    // Prefer the component's progress bar element (works for document-level mousemove)
    const progressBarEl = this.progressBarRef?.nativeElement as HTMLElement | undefined;
    const progressBar = progressBarEl ?? (event.currentTarget as HTMLElement);
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;

    // position tooltip (x relative to container)
    this.hoverLeft = x;
    const index = (percent / 100) * (this.latLngArray.length - 1);
    const nearest = Math.round(index);
    const ts = (this.latLngArray[nearest] && (this.latLngArray[nearest] as any).eventDateTime) ?? this.data[nearest]?.timestamp ?? null;
    this.progressHoverTimestamp = this.formatTimestamp(ts);
    this.showProgressTooltip = true;

    // If dragging, also perform seek
    if (this.isDraggingProgressBar) {
      if (this.customOverlay && typeof this.customOverlay.seekToIndex === 'function') {
        this.customOverlay.seekToIndex(index);
        this.progressPercentage = percent;
      }
    }
  }

  onProgressBarMouseLeave() {
    if (!this.isDraggingProgressBar) {
      this.showProgressTooltip = false;
    }
  }

  onProgressBarMouseDown(event: MouseEvent) {
    // Start dragging
    this.isDraggingProgressBar = true;
    // attach document listeners to capture movement outside the element
    this._docMouseMove = (e: MouseEvent) => this.onProgressBarMouseMove(e as MouseEvent);
    this._docMouseUp = (e: MouseEvent) => this.onDocumentMouseUp(e as MouseEvent);
    window.addEventListener('mousemove', this._docMouseMove);
    window.addEventListener('mouseup', this._docMouseUp);
    // immediately handle the initial click position
    this.onProgressBarMouseMove(event);
  }

  onDocumentMouseUp(event: MouseEvent) {
    // Stop dragging
    this.isDraggingProgressBar = false;
    this.showProgressTooltip = false;
    if (this._docMouseMove) {
      window.removeEventListener('mousemove', this._docMouseMove);
      this._docMouseMove = null;
    }
    if (this._docMouseUp) {
      window.removeEventListener('mouseup', this._docMouseUp);
      this._docMouseUp = null;
    }
  }

  ngOnDestroy(): void {
    // cleanup listeners
    if (this._docMouseMove) window.removeEventListener('mousemove', this._docMouseMove);
    if (this._docMouseUp) window.removeEventListener('mouseup', this._docMouseUp);
    if (this.customOverlay && this.positionChangedListener) {
      try { this.customOverlay.removeListener && this.customOverlay.removeListener('positionChanged', this.positionChangedListener); } catch(err) {}
    }
  }

}
