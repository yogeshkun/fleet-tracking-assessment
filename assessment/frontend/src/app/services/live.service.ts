import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { TripService } from './trip.service';

@Injectable({ providedIn: 'root' })
export class LiveService {
  // NOTE: backend websocket endpoint — adjust if your server exposes a different URL
  private wsBase = 'ws://localhost:4000/live';
  // base REST API (reuse TripService base)
  private apiBase = 'http://localhost:4000/api/trips';
  // Track active EventSources to avoid duplicate connections
  private activeStreams: Map<string, EventSource> = new Map();

  constructor(private tripService: TripService) {
    // try to reuse TripService baseUrl if available
    try { this.apiBase = (this.tripService as any).baseUrl || this.apiBase; } catch (e) {}
  }

  // Subscribe to a vehicle's live stream. Returns an Observable that emits raw messages from server.
  // The backend is expected to accept a query param ?vehicle=<id> to filter stream for a vehicle.
  subscribeToVehicle(vehicleId: string): WebSocketSubject<any> {
    const url = `${this.wsBase}?vehicle=${encodeURIComponent(vehicleId)}`;
    return webSocket(url);
  }

  // Subscribe to HTTP Server-Sent Events (SSE) stream for a specific trip and vehicle
  // Returns an Observable which emits parsed JSON messages from the stream endpoint
  subscribeToVehicleStream(tripFilename: string, vehicleId: string): Observable<any> {
    const url = `${this.apiBase}/details/stream/${encodeURIComponent(tripFilename)}/${encodeURIComponent(vehicleId)}`;
    const streamKey = `${tripFilename}::${vehicleId}`;

    return new Observable((observer) => {
      // If a stream already exists for this key, reuse it (avoid duplicate connections)
      if (this.activeStreams.has(streamKey)) {
        const existingEs = this.activeStreams.get(streamKey);
        if (existingEs) {
          console.log(`Reusing existing stream for ${streamKey}`);
          // Note: can't easily share EventSource listeners, so create a new one
          // This is a limitation of EventSource. In production, use a single WebSocket or multiplexed API.
        }
      }

      let es: EventSource | null = null;
      try {
        console.log(`Creating new EventSource for ${streamKey}:`, url);
        es = new EventSource(url);
        this.activeStreams.set(streamKey, es);
      } catch (err) {
        console.error(`Failed to create EventSource for ${streamKey}:`, err);
        observer.error(err);
        return () => {};
      }

      es.onopen = () => {
        console.log(`EventSource opened for ${streamKey}`);
      };

      es.onmessage = (ev) => {
        try {
          console.log(`Message from ${streamKey}:`, ev.data);
          const data = JSON.parse(ev.data);
          observer.next(data);
        } catch (e) {
          // If not JSON, emit raw
          console.log(`Raw message from ${streamKey}:`, ev.data);
          observer.next(ev.data);
        }
      };

      es.onerror = (err) => {
        console.error(`EventSource error for ${streamKey}:`, err);
        observer.error(err);
        // keep EventSource open; caller may decide to retry
      };

      return () => {
        if (es) {
          try {
            console.log(`Closing EventSource for ${streamKey}`);
            es.close();
          } catch (e) {}
          this.activeStreams.delete(streamKey);
          es = null;
        }
      };
    });
  }
}

