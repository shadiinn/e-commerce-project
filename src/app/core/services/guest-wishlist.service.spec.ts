import { TestBed } from '@angular/core/testing';

import { GuestWishlistService } from './guest-wishlist.service';

describe('GuestWishlistService', () => {
  let service: GuestWishlistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuestWishlistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
