import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackTracingComponent } from './track-tracing.component';

describe('TrackTracingComponent', () => {
  let component: TrackTracingComponent;
  let fixture: ComponentFixture<TrackTracingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrackTracingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackTracingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
