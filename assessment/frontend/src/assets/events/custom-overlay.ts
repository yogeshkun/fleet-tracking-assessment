import { OverlayOptions, path } from './custom-overlay.interface';
import { EventEmitter } from './events';

export class CustomOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement;
    private image: string;
    private position: google.maps.LatLngLiteral;
    private angle: number;
    private speed: number;
    private isPaused: boolean;
    private animationFrameId: number | null;
    private path: path[];
    private currentIndex: number;
    private currentAnimationFraction: number;
    private startTime: number;
    private baseAnimationDuration: number;
    private currentAngle: number;
    private basePosition: { lat: number, lng: number };
    private baseAngle: number;
    private pathCompleted: boolean;
    private emitter: EventEmitter;
    private isReset: boolean;
    private isZooming: boolean = false;
    private zoomTimeout: any = null;
    private wasAnimatingBeforeZoom: boolean = false;
    zoomFrame: number | any;
    storedPosition!: { lat: number; lng: number; };
    storedAngle!: number;
    private labelDiv!: HTMLDivElement;
    private img: HTMLImageElement;
    private tooltipDiv!: HTMLDivElement;
    private signalQuality: 'excellent' | 'good' | 'poor' | null = null;
    vehicleSpeed: any;
    odometer: any;
    eventDateTime: any;
    speedButton: any;
    modeButton: any;
    timestamp: any;
    overlayOptions : OverlayOptions;
    locationLabel: any;
    showLocationLoading : boolean;
    odometerLabel:any;
    speedIcon = document.createElement('img');
    odometerIcon = document.createElement('img');

    constructor(OverlayOptions: OverlayOptions) {
        super();
        this.image = OverlayOptions.image;
        this.position = OverlayOptions.position;
        this.angle = OverlayOptions.angle;
        this.overlayOptions = OverlayOptions;

        this.speed = OverlayOptions.speed;
        this.isPaused = true;
        this.animationFrameId = null;
        this.path = OverlayOptions.path;
        this.showLocationLoading = false;
        this.currentIndex = 0;
        this.vehicleSpeed = '0 Km/Hr';
        this.odometer = '0 Km';
        const date = new Date(OverlayOptions.path[0].eventDateTime ?? "");
        console.log('OverlayOptions', OverlayOptions)
        console.log('odometer', this.odometer)

        // Add 5 hours and 30 minutes (IST adjustment)
        date.setHours(date.getHours() + 5);
        date.setMinutes(date.getMinutes() + 30);

        // Format time and date separately
        const timePart = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).toUpperCase(); // Ensures AM/PM is uppercase

        const datePart = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
        });

        // Combine into the desired format
        const formattedDate = `${timePart}, ${datePart}`;
        this.eventDateTime = formattedDate;
        this.currentAnimationFraction = 0;
        this.startTime = 0;
        this.baseAnimationDuration = 3000;
        this.currentAngle = OverlayOptions.angle;
        this.isReset = false;

        this.basePosition = OverlayOptions.position;
        this.baseAngle = OverlayOptions.angle;

        this.pathCompleted = false;
        this.emitter = new EventEmitter();

        // Create the overlay's div element
        this.div = document.createElement('div');
        this.div.className = 'overlay-main';
        this.div.style.position = 'absolute';
        if (OverlayOptions.zIndex) {
            this.div.style.zIndex = OverlayOptions.zIndex;
        }

        // Add vehicle image
        this.img = document.createElement('img');
        this.img.className = 'overlay-vehicle-img';
        this.img.src = this.image;
        this.img.style.width = OverlayOptions.width;
        this.img.style.height = OverlayOptions.height;
        this.div.style.marginLeft = OverlayOptions.marginLeft;
        this.div.style.marginTop = OverlayOptions.marginTop;
        this.div.appendChild(this.img);

        // Tooltip that shows current speed on hover
        this.tooltipDiv = document.createElement('div');
        this.tooltipDiv.className = 'overlay-tooltip';
        this.tooltipDiv.style.position = 'absolute';
        this.tooltipDiv.style.bottom = `calc(${OverlayOptions.height} + 8px)`; // place above vehicle
        this.tooltipDiv.style.left = '50%';
        this.tooltipDiv.style.transform = 'translateX(-50%)';
        this.tooltipDiv.style.background = 'rgba(0,0,0,0.75)';
        this.tooltipDiv.style.color = '#fff';
        this.tooltipDiv.style.padding = '6px 8px';
        this.tooltipDiv.style.borderRadius = '6px';
        this.tooltipDiv.style.fontSize = '12px';
        this.tooltipDiv.style.whiteSpace = 'nowrap';
        this.tooltipDiv.style.display = 'none';
        this.tooltipDiv.style.pointerEvents = 'none';
        this.tooltipDiv.setAttribute('role', 'tooltip');
        this.div.appendChild(this.tooltipDiv);

        // Show tooltip on hover over the vehicle image
        this.img.addEventListener('mouseenter', () => {
            this.updateTooltipContent();
            this.tooltipDiv.style.display = 'block';
        });
        this.img.addEventListener('mouseleave', () => {
            this.tooltipDiv.style.display = 'none';
        });


        if (OverlayOptions.isLabel) {

            // Create the label div
            this.labelDiv = document.createElement('div');
            this.labelDiv.className = 'overlay-label';
            this.labelDiv.style.position = 'fixed';
            this.labelDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.5);';
            this.labelDiv.style.width = 'auto';
            this.labelDiv.style.boxShadow = '0px 4px 10px rgba(0, 0, 0, 0.3)';
            this.labelDiv.style.borderRadius = '12px';
            this.labelDiv.style.padding = '10px';
            this.labelDiv.style.display = 'flex';
            this.labelDiv.style.flexDirection = 'column';
            this.labelDiv.style.justifyContent = 'space-between';
            this.labelDiv.style.alignItems = 'center';
            this.labelDiv.style.gap = '10px';

            // Timestamp and location icon
            this.timestamp = document.createElement('div');
            this.timestamp.className = 'overlay-timestamp';
            this.timestamp.style.fontSize = '14px';
            this.timestamp.style.color = '#000000';
            this.timestamp.innerHTML = `${this.eventDateTime}`;

            const locationIcon = document.createElement('img');
            locationIcon.className = 'overlay-location-icon';
            locationIcon.src = OverlayOptions.locationIcon;
            locationIcon.alt = 'Location Icon';
            locationIcon.style.width = '20px';
            locationIcon.style.cursor = 'pointer';
            locationIcon.style.height = '20px';
            locationIcon.style.marginLeft = '5px';
            locationIcon.addEventListener('click', () => {
                this.showLocationLoading = true;
                // if(this.showLocationLoading){
                this.locationLabel.style.display = 'block';
                this.locationLabel.innerHTML = 'Loading...';
                this.setLabelPosition({left:this.overlayOptions.labelStyling.left,top: 7});
                // }
                this.emitter.emit('LocationIconClicked', { index : this.currentIndex});
              });

            this.speedIcon.src = OverlayOptions.speedIcon;
            this.speedIcon.alt = 'Speed Icon';
            this.speedIcon.style.width = '25px';
            this.speedIcon.style.height = '25px';

            // Speed button
            this.speedButton = document.createElement('button');
            this.speedButton.className = 'overlay-speed-button';
            this.speedButton.style.backgroundColor = '#007BFF';
            this.speedButton.style.color = '#FFFFFF';
            this.speedButton.style.border = 'none';
            this.speedButton.style.padding = '5px 10px';
            this.speedButton.style.borderRadius = '20px';
            this.speedButton.style.fontSize = '12px';
            this.speedButton.innerHTML = '';
            this.speedButton.appendChild(this.speedIcon);
            this.speedButton.append(` ${this.vehicleSpeed}`);
            this.speedButton.style.display = 'flex';
            this.speedButton.style.alignItems = 'center';
            this.speedButton.style.gap = '5px';

            this.odometerIcon.src = OverlayOptions.odometerIcon;
            this.odometerIcon.alt = 'Odometer Icon';
            this.odometerIcon.style.width = '25px';
            this.odometerIcon.style.height = '25px';

            this.odometerLabel = document.createElement('button');
            this.odometerLabel.className = 'overlay-speed-button';
            this.odometerLabel.style.color = '#000000';
            this.odometerLabel.style.border = 'none';
            this.odometerLabel.style.padding = '5px 10px';
            this.odometerLabel.style.fontSize = '12px';
            this.odometerLabel.innerHTML = '';
            this.odometerLabel.appendChild(this.odometerIcon);
            this.odometerLabel.append(` ${this.odometer}`);
            this.odometerLabel.style.display = 'flex';
            this.odometerLabel.style.alignItems = 'center';
            this.odometerLabel.style.gap = '5px';


            // Mode button
            this.modeButton = document.createElement('button');
            this.modeButton.className = 'overlay-mode-button'; // Add class
            this.modeButton.innerText = '-';
            this.modeButton.style.backgroundColor = '#28A745';
            this.modeButton.style.color = '#FFFFFF';
            this.modeButton.style.border = 'none';
            this.modeButton.style.padding = '5px 10px';
            this.modeButton.style.borderRadius = '20px';
            this.modeButton.style.fontSize = '12px';

            this.locationLabel = document.createElement('div');
            this.locationLabel.className = 'location-label';
            this.locationLabel.style.display = 'none';
            this.locationLabel.innerText = '-';
            this.locationLabel.style.width = '20ch';
            this.locationLabel.style.textOverflow = 'hidden';
            this.locationLabel.style.color = '#4C4C4C';
            this.locationLabel.style.padding = '5px';
            this.locationLabel.style.fontSize = '12px';

            // Left section with timestamp and location icon
            const leftSection = document.createElement('div');
            leftSection.className = 'overlay-left-section'; // Add class
            leftSection.style.display = 'flex';
            leftSection.style.alignItems = 'center';
            leftSection.style.justifyContent = 'center';
            leftSection.style.gap = '12px';
            leftSection.style.width = '100%';
            leftSection.appendChild(this.timestamp);
            leftSection.appendChild(locationIcon);

            // Right section with speed and mode buttons
            const rightSection = document.createElement('div');
            rightSection.className = 'overlay-right-section'; // Add class
            rightSection.style.display = 'flex';
            rightSection.style.alignItems = 'center';
            rightSection.style.justifyContent = 'space-between';
            rightSection.style.width = '100%';
            rightSection.style.gap = '5px';
            // rightSection.appendChild(speedIcon);
            rightSection.appendChild(this.speedButton);
            rightSection.appendChild(this.modeButton);
            // rightSection.appendChild(odometerIcon);
            rightSection.appendChild(this.odometerLabel);



            // Append left and right sections to the label div
            this.labelDiv.appendChild(leftSection);
            this.labelDiv.appendChild(rightSection);
            this.labelDiv.appendChild(this.locationLabel);

            // Append label div to the main div
            this.div.appendChild(this.labelDiv);
        }
        // Append the main div to the DOM
        document.body.appendChild(this.div);

    }

    getPointsAtFixedIntervals(polyline: google.maps.Polyline,points: any[], intervalMeters: number) {
        const path = polyline.getPath();
        const fixedPoints = [];
        let distanceCovered = 0;
        const totalLength = google.maps.geometry.spherical.computeLength(path);

        for (let i = 0; i < path.getLength() - 1; i++) {
          const start = path.getAt(i);
          const end = path.getAt(i + 1);
          fixedPoints.push({lat: start.lat(),lng: start.lng(),original : true,...points[i]});
          const segmentLength = google.maps.geometry.spherical.computeDistanceBetween(start, end);

          while (distanceCovered <= totalLength && distanceCovered <= segmentLength) {
            const fraction = distanceCovered / segmentLength;
            const interpolatedPoint = google.maps.geometry.spherical.interpolate(start, end, fraction);
            fixedPoints.push({
              lat: interpolatedPoint.lat(),
              lng: interpolatedPoint.lng(),
              original : false
            });
            distanceCovered += intervalMeters;
          }
          distanceCovered -= segmentLength;
        }

        const lastPoint = path.getAt(path.getLength() - 1);
        fixedPoints.push({ lat: lastPoint.lat(), lng: lastPoint.lng(),original : true ,...points[-1]});
        return fixedPoints;
    }

    override onAdd() {
        const panes: any = this.getPanes();
        panes.overlayMouseTarget.appendChild(this.div);
        this.attachZoomListener();
        this.draw()
    }

    private attachZoomListener() {
        try {
            const map: any = this.getMap();
            if (map) {
                // Listen for zoom changes
                map.addListener('zoom_changed', () => {
                    this.handleZoomStart();
                });
            }
        } catch (e) {
            // Ignore if map not ready
        }
    }

    private handleZoomStart() {
        // Pause animation if it's running
        if (!this.isPaused) {
            this.wasAnimatingBeforeZoom = true;
            this.pauseAnimation();
        }
        this.isZooming = true;

        // Clear previous timeout
        if (this.zoomTimeout) {
            clearTimeout(this.zoomTimeout);
        }

        // Resume animation after zoom has stopped (user stops interacting for 500ms)
        this.zoomTimeout = setTimeout(() => {
            this.isZooming = false;
            // Resume if it was animating before zoom
            if (this.wasAnimatingBeforeZoom && this.isPaused) {
                this.resumeAnimation();
                this.wasAnimatingBeforeZoom = false;
            }
        }, 500);
    }

    public updatePath(updatedPath: { lat: number; lng: number; degree: number; vehicleSpeed: number; eventDateTime: string; odometer: number }[]){
        this.path = updatedPath;
    }


    override draw() {
        const projection = this.getProjection();
        const position = new google.maps.LatLng(this.position.lat, this.position.lng);
        if (projection) {

            const pixelPosition: any = projection?.fromLatLngToDivPixel(position);
            if (pixelPosition.x && pixelPosition.y) {
                this.div.style.left = `${pixelPosition.x}px`;
                this.div.style.top = `${pixelPosition.y}px`;

                if (this.labelDiv) {
                    // Update label position fixed above the vehicle
                    this.labelDiv.style.left = `${pixelPosition.x - this.overlayOptions.labelStyling.left * 16}px`;
                    this.labelDiv.style.top = `${pixelPosition.y - this.overlayOptions.labelStyling.top * 16}px`;
                }
            }
        }
    }

    setLabelPosition(labelStyling : { left : number, top:number}){
        const projection = this.getProjection();
        const position = new google.maps.LatLng(this.position.lat, this.position.lng);
        if (projection) {
            const pixelPosition: any = projection?.fromLatLngToDivPixel(position);
            if (pixelPosition.x && pixelPosition.y) {
                if (this.labelDiv) {
                    this.labelDiv.style.left = `${pixelPosition.x - labelStyling.left * 16}px`;
                    this.labelDiv.style.top = `${pixelPosition.y - labelStyling.top * 16}px`;
                }
            }
        }
    }

    override onRemove() {
        if (this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.zoomTimeout) {
            clearTimeout(this.zoomTimeout);
        }
        this.emitter.removeListener('positionChanged', () => { });
        this.emitter.removeListener('set_position', () => { });
    }

    public RemoveMarker() {
        this.onRemove()
    }

    setAngle(angle: number) {
        this.angle = angle;
        this.img.style.transform = `rotate(${this.angle}deg)`;
    }

    setPosition(position: any) {
        this.position = { lat: position.lat, lng: position.lng };
        this.draw();

        // Update individual fields if provided (don't require all)
        if (position?.vehicleSpeed !== undefined && position?.vehicleSpeed !== null) {
            // store as numeric-ish string like "39.3 Km/Hr"
            this.vehicleSpeed = `${position?.vehicleSpeed} Km/Hr`;
            this.signalQuality = position?.signal_quality;
            if (this.tooltipDiv) this.updateTooltipContent();
        }
        if (position?.eventDateTime !== undefined && position?.eventDateTime !== null) {
            this.eventDateTime = position?.eventDateTime;
        }
        if (position?.odometer !== undefined && position?.odometer !== null) {
            this.odometer = `${position?.odometer} Km`;
        }

        this.emitter.emit('set_position', { position: this.position });
    }

    public updateOverlayContent(data: { vehicleSpeed?: number, eventDateTime?: string, mode?: string, locationName? : string , odometer:number, signal_quality: 'excellent' | 'good' | 'poor' | null}) {
        if(data?.vehicleSpeed){
            this.speedButton.innerHTML = '';
            this.speedButton.appendChild(this.speedIcon);
            this.speedButton.append(` ${this.vehicleSpeed}`);
            this.vehicleSpeed = `${data?.vehicleSpeed} Km/Hr`;
            this.signalQuality = data?.signal_quality;
            if (this.tooltipDiv) this.updateTooltipContent();
        }
        if(data?.mode){
            this.modeButton.innerText = `${data.mode}`;
        }
        if(data?.eventDateTime){
            this.timestamp.innerHTML = `<span>${data.eventDateTime}</span>`;
        }
        if(data?.locationName){
            this.setLabelPosition({left:this.overlayOptions.labelStyling.left,top: 7});
            this.locationLabel.style.display = 'flex';
            this.locationLabel.innerHTML = `<span>${data.locationName}</span>`
            this.showLocationLoading = false;
        }
        else if(data?.locationName === ''){
            this.locationLabel.style.display = 'none';
        }
        if(data?.odometer){
            this.odometerLabel.innerHTML = '';
           this.odometerLabel.appendChild(this.odometerIcon);
            this.odometerLabel.append(` ${this.odometer}`);
            this.odometer = `${data?.odometer} Km`;
        }
    }

    // Format timestamp to "12:40 AM, 11 Nov 25" from ISO string like "2025-11-03T11:02:45.266Z"
    private formatTimestampForTooltip(ts?: string): string {
        if (!ts) return '-';
        try {
            const d = new Date(ts);
            const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
            const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
            return `${timePart}, ${datePart}`;
        } catch (e) {
            return '-';
        }
    }

    // Update tooltip text (current speed and timestamp) when requested
    private formatTooltipSpeed(): string {
      const v = this.vehicleSpeed ?? '';
      const s = String(v);
      const match = s.match(/[\d\.]+/);
      const num = match ? match[0] : s || '-';
      const ts = this.formatTimestampForTooltip(this.eventDateTime);
      const signalIcon = this.getSignalIcon();

      return `${signalIcon} <b>Speed:</b> ${num} km/h<br><b>Timestamp:</b> ${ts}`;
    }

    private updateTooltipContent() {
        if (!this.tooltipDiv) return;
        this.tooltipDiv.innerHTML = this.formatTooltipSpeed();
    }

    private getSignalColor(): string {
      const quality = this.signalQuality?.toLowerCase?.() ?? "unknown";

      switch (quality) {
          case "excellent":
              return "#00C853"; // green
          case "good":
              return "#FFD600"; // yellow
          case "poor":
              return "#D50000"; // red
          default:
              return "#9E9E9E"; // gray (unknown / undefined / null)
      }
    }

    private getSignalIcon(): string {
        const color = this.getSignalColor();
        console.log("color in signal", color);
        // Simple Wi-Fi arcs SVG (scalable, color dynamic)
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                <path d="M8.5 16a6 6 0 0 1 7 0"/>
                <path d="M12 20h.01"/>
            </svg>
        `;
    }

    // updateLabel() {
    //     // Display label with real-time data (e.g., speed, angle)
    //     this.labelDiv.textContent = `Speed: ${this.vehicleSpeed} km/h | Event: ${this.eventDateTime}`;
    //     this.labelDiv.style.display = 'block'; // Show label when the vehicle is moving
    // }

    startAnimation() {
        if (!this.isPaused) return;
        this.isReset = false;
        this.isPaused = false;
        this.startTime = new Date().getTime();
        // Center the map on the vehicle at start
        try {
            const map: any = this.getMap();
            if (map && typeof map.setCenter === 'function') {
                map.setCenter(this.position);
            }
        } catch (e) {
            // Ignore if map not ready
        }
        this.animate();
    }

    public pauseAnimation() {
        this.isPaused = true;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.storedPosition = this.position;
        this.storedAngle = this.currentAngle;
    }

    resumeAnimation() {
        if (!this.isPaused) return;

        this.isPaused = false;
        this.startTime = new Date().getTime();
        // Center the map on the vehicle when resuming
        try {
            const map: any = this.getMap();
            if (map && typeof map.setCenter === 'function') {
                map.setCenter(this.position);
            }
        } catch (e) {
            // Ignore if map not ready
        }
        this.animate();
    }
    public setSpeed(speed: number) {
        this.speed = speed;
    }

    seekToIndex(index: number) {
        if (!this.path || index < 0 || index >= this.path.length) {
            return;
        }

        // Pause animation if running
        const wasAnimating = !this.isPaused;
        if (wasAnimating) {
            this.pauseAnimation();
        }

        // Update current index and position
        this.currentIndex = Math.floor(index);
        this.currentAnimationFraction = index - Math.floor(index);

        if (this.currentIndex >= this.path.length) {
            this.currentIndex = this.path.length - 1;
            this.currentAnimationFraction = 0;
        }

        const currentPath = this.path[this.currentIndex];
        if (currentPath) {
            this.position = { lat: currentPath.lat, lng: currentPath.lng };
            this.angle = currentPath.degree || 0;
            this.currentAngle = this.angle;

            // Update vehicle speed and timestamp for tooltip
            const vehicleSpeed = currentPath.vehicleSpeed ?? 0;
            const eventDateTime = currentPath.eventDateTime ?? '';
            this.setPosition(this.position);
            this.setAngle(this.angle);

            // Emit position changed event to update progress bar
            this.emitter.emit('positionChanged', { position: this.position, angle: this.angle });

            // Center map on seeked position
            try {
                const map: any = this.getMap();
                if (map && typeof map.setCenter === 'function') {
                    map.setCenter(this.position);
                }
            } catch (e) {
                // Ignore if map not ready
            }
        }

        // Resume animation if it was running before seeking
        if (wasAnimating) {
            this.resumeAnimation();
        }
    }

    getPosition(): google.maps.LatLngLiteral {
        return this.position;
    }

    getCurrentIndex(): number {
        return this.currentIndex;
    }

    reset() {
        this.pauseAnimation();
        this.position = this.basePosition;
        this.angle = this.baseAngle;
        this.currentIndex = 0;
        this.currentAnimationFraction = 0;
        this.currentAngle = this.angle;
        this.pathCompleted = false;
        this.isReset = true;

        this.setPosition(this.position);
        this.setAngle(this.angle);

        // Center the map on the starting position after reset
        try {
            const map: any = this.getMap();
            if (map && typeof map.setCenter === 'function') {
                map.setCenter(this.basePosition);
            }
        } catch (e) {
            // Ignore if map not ready
        }

        this.emitter.emit('reset', { position: this.position, angle: this.angle });
        this.emitter.removeListener('positionChanged', () => { });
        this.emitter.removeListener('set_position', () => { });

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    smoothPanTo(targetLatLng: google.maps.LatLngLiteral, duration: number = 100, targetZoom?: number) {
        const map: google.maps.Map | google.maps.StreetViewPanorama | any = this.getMap();
        const startLatLng = map.getCenter().toJSON();
        const startZoom = map.getZoom();
        const startTime = new Date().getTime();

        const animateMap = () => {
            const now = new Date().getTime();
            const elapsedTime = now - startTime;
            const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

            const fraction = easeInOutQuad(elapsedTime / duration);
            // const fraction = Math.min(elapsedTime / duration, 1);

            // Calculate the new lat/lng based on interpolation
            const newLat = startLatLng.lat + (targetLatLng.lat - startLatLng.lat) * fraction;
            const newLng = startLatLng.lng + (targetLatLng.lng - startLatLng.lng) * fraction;

            // If targetZoom is provided, interpolate the zoom level
            if (typeof targetZoom === 'number') {
                const newZoom = startZoom + (targetZoom - startZoom) * fraction;
                map.setZoom(newZoom);
            }

            // Set the new center of the map
            map.setCenter({ lat: newLat, lng: newLng });

            if (fraction < 1) {
                requestAnimationFrame(animateMap);
            }
        };

        requestAnimationFrame(animateMap);
    }

    setZoom(newZoom:number){
        const map : google.maps.Map | google.maps.StreetViewPanorama | any = this.getMap();
        console.log("map zoom set",newZoom)
        map.setZoom(newZoom);
        console.log("checking if zoom is applied",map.getZoom())
    }

    setSmoothCenter() {
        const map: google.maps.Map | google.maps.StreetViewPanorama | any = this.getMap();
        let currentLatLng = this.getPosition();
        const currentZoom = map?.getZoom();
        map.setCenter(currentLatLng, currentZoom);
    }

    updateOverlayData(data: { vehicleSpeed?: number, eventDateTime?: string, mode?: string, locationName?: string, odometer:number, signal_quality: 'excellent' | 'good' | 'poor' | null }) {
        if (this.labelDiv) {
            this.updateOverlayContent(data);
        }
    }


    public getAngle(p1: { lat: any; lng: any; degree?: number; }, p2: { lat: any; lng: any; degree?: number; }): number {
        const f1 = Math.PI * p1.lat / 180;
        const f2 = Math.PI * p2.lat / 180;
        const dl = Math.PI * (p2.lng - p1.lng) / 180;
        return Math.atan2(Math.sin(dl) * Math.cos(f2), Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl));
    };

    // Calculate the distance between two LatLng points
        private calculateDistance(point1: google.maps.LatLngLiteral, point2: google.maps.LatLngLiteral): number {
            const latLng1 = new google.maps.LatLng(point1.lat, point1.lng);
            const latLng2 = new google.maps.LatLng(point2.lat, point2.lng);
            return google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2); // returns distance in meters
        }

        latlngDistance(p1: { lat: number; lng: number; }, p2: { lat: number; lng: number; }): number {
            const EarthRadiusMeters = 6378137.0; // meters
            const dLat = (p2.lat - p1.lat) * Math.PI / 180;
            const dLon = (p2.lng - p1.lng) * Math.PI / 180;
            const angle = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180 ) * Math.cos(p2.lat * Math.PI / 180 ) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(angle), Math.sqrt(1 - angle));
            const distance = EarthRadiusMeters * c;
            return distance;
        };


    public animate() {
        const pathLength = this.path.length;
        const baseAnimationDuration = this.baseAnimationDuration;
        const path = this.path;
        let startTime = new Date().getTime();
        let currentLatLng = this.storedPosition || path[this.currentIndex];  // Use stored position if resuming
        const map: any = this.getMap();
        const currentZoom = map?.getZoom();

        const updateVehiclePosition = () => {


            if (this.isPaused) return;

            const now = new Date().getTime();
            const elapsed = now - startTime;
            const duration = baseAnimationDuration / this.speed;
            let fraction = elapsed / duration + this.currentAnimationFraction;  // Use current animation fraction

            if (fraction >= 1) {
                fraction = 1;
            }

            const nextIndex = (this.currentIndex + 1) % pathLength;
            const nextLatLng = path[nextIndex];

            const lat = currentLatLng.lat + (nextLatLng.lat - currentLatLng.lat) * fraction;
            const lng = currentLatLng.lng + (nextLatLng.lng - currentLatLng.lng) * fraction;

            const angle = this.getAngle(currentLatLng, nextLatLng) * 180 / Math.PI;

            // Interpolate speed between current and next point if available
            const speedA = Number((currentLatLng as any).vehicleSpeed ?? (currentLatLng as any).speed ?? 0);
            const speedB = Number((nextLatLng as any).vehicleSpeed ?? (nextLatLng as any).speed ?? speedA);
            const interpSpeed = speedA + (speedB - speedA) * fraction;

            // Interpolate eventDateTime: use current point's timestamp
            const eventDateTime = (currentLatLng as any).eventDateTime ?? (nextLatLng as any).eventDateTime ?? null;

            this.setPosition({ lat, lng, vehicleSpeed: Number(interpSpeed.toFixed(1)), eventDateTime });
            this.setAngle(angle);

            // Always center the map on the vehicle during animation
            try {
                const map: any = this.getMap();
                if (map && typeof map.setCenter === 'function') {
                    map.setCenter({ lat, lng });
                }
            } catch (e) {
                // Ignore if map not ready
            }

            if (fraction < 1) {

                this.animationFrameId = requestAnimationFrame(updateVehiclePosition);
            } else {
                this.currentAnimationFraction = 0;
                this.currentIndex = nextIndex;

                if (this.currentIndex === pathLength - 1) {
                    this.pathCompleted = true;
                    this.pauseAnimation();
                    this.emitter.emit('pathCompleted', { position: this.position });
                } else {
                    startTime = new Date().getTime();
                    currentLatLng = path[this.currentIndex];
                    this.currentAngle = path[this.currentIndex].degree;
                    this.setPosition(currentLatLng);
                    if (!this.isReset) {
                        this.emitter.emit('positionChanged', { ...currentLatLng, degree: this.currentAngle });
                    }

                    this.animationFrameId = requestAnimationFrame(updateVehiclePosition);
                }
            }
        };

        this.animationFrameId = requestAnimationFrame(updateVehiclePosition);
    }

    on(event: string, listener: (data: any) => void) {
        this.emitter.on(event, listener);
    }
    removeListener(event: string, listener: (data: any) => void) {
        this.emitter.removeListener(event, listener);
    }


}


export { OverlayOptions } from './custom-overlay.interface';
