import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveTrackComponent } from './live-track.component';

describe('LiveTrackComponent', () => {
  let component: LiveTrackComponent;
  let fixture: ComponentFixture<LiveTrackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiveTrackComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
