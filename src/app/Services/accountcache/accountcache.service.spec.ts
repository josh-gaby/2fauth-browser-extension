import { TestBed } from '@angular/core/testing';

import { AccountCacheService } from './accountcache.service';

describe('AccountCacheService', () => {
  let service: AccountCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
