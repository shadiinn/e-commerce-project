import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GuestWishlistService {

  private readonly STORAGE_KEY = 'sa_guest_wishlist';


  // =====================================================
  // GET GUEST WISHLIST
  // =====================================================

  getWishlist(): string[] {

    const storedWishlist =
      localStorage.getItem(this.STORAGE_KEY);

    if (!storedWishlist) {
      return [];
    }

    try {

      return JSON.parse(storedWishlist) as string[];

    } catch (error) {

      console.error(
        'FAILED TO READ GUEST WISHLIST:',
        error
      );

      return [];

    }

  }


  // =====================================================
  // ADD PRODUCT
  // =====================================================

  addItem(productId: string): void {

    const wishlist =
      this.getWishlist();

    if (wishlist.includes(productId)) {
      return;
    }

    wishlist.push(productId);

    this.saveWishlist(wishlist);

  }


  // =====================================================
  // REMOVE PRODUCT
  // =====================================================

  removeItem(productId: string): void {

    const wishlist =
      this.getWishlist();

    const updatedWishlist =
      wishlist.filter(
        id => id !== productId
      );

    this.saveWishlist(updatedWishlist);

  }


  // =====================================================
  // CLEAR WISHLIST
  // =====================================================

  clearWishlist(): void {

    localStorage.removeItem(
      this.STORAGE_KEY
    );

  }


  // =====================================================
  // SAVE
  // =====================================================

  private saveWishlist(
    items: string[]
  ): void {

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(items)
    );

  }

}