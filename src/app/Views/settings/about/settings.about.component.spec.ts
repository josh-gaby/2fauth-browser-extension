import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsAboutComponent } from './settings.about.component';

describe('SettingsComponent', () => {
  let component: SettingsAboutComponent;
  let fixture: ComponentFixture<SettingsAboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsAboutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsAboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
