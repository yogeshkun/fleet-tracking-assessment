import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { TrackTracingComponent } from './components/track-tracing/track-tracing.component';
import { HomepageComponent } from './components/homepage/homepage.component';
import { LiveTrackComponent } from './components/live-track/live-track.component';
import { BaseUrlInterceptor } from './interceptors/base-url.interceptor';

@NgModule({
  schemas:[NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    AppComponent,
    TrackTracingComponent,
    HomepageComponent,
    LiveTrackComponent,
    // TripTracingComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,GoogleMapsModule

  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: BaseUrlInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
