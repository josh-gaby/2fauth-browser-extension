import { TestBed } from '@angular/core/testing';

import { LocalsettingsService } from './localsettings.service';

describe('LocalsettingsService', () => {
  let service: LocalsettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalsettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
