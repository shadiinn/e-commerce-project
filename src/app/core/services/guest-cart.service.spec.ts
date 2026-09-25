import { TestBed } from '@angular/core/testing';

import { GuestCartService } from './guest-cart.service';

describe('GuestCartService', () => {
  let service: GuestCartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuestCartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
