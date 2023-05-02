import { TestBed } from '@angular/core/testing';

import { ServiceWorkerService } from './serviceworker.service';

describe('ServiceWorkerService', () => {
  let service: ServiceWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceWorkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
