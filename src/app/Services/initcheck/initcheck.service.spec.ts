import { TestBed } from '@angular/core/testing';

import { InitCheckService } from './initcheck.service';

describe('InitCheckService', () => {
  let service: InitCheckService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InitCheckService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
