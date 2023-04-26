import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtpDisplayerComponent } from './otpdisplayer.component';

describe('OtpDisplayerComponent', () => {
  let component: OtpDisplayerComponent;
  let fixture: ComponentFixture<OtpDisplayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OtpDisplayerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtpDisplayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
