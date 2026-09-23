import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { WishlistItem } from '../models/wishlist.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private http = inject(HttpClient);

  private readonly API_URL =
    'http://localhost:3000/wishlists';


  // =====================================================
  // GET WISHLIST
  // =====================================================

  getWishlist(): Observable<WishlistItem[]> {

    return this.http.get<WishlistItem[]>(
      this.API_URL
    );

  }


  // =====================================================
  // ADD TO WISHLIST
  // =====================================================

  addWishlistItem(
    item: WishlistItem
  ): Observable<WishlistItem> {

    return this.http.post<WishlistItem>(
      this.API_URL,
      item
    );

  }


  // =====================================================
  // REMOVE FROM WISHLIST
  // =====================================================

  removeWishlistItem(
    id: string
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.API_URL}/${id}`
    );

  }

}