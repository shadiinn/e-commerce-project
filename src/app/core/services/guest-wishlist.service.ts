import { inject, Injectable } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class GuestWishlistService {

  private readonly STORAGE_KEY = 'sa_guest_wishlist';
  toastservice=inject(ToastService)

  // GET GUEST WISHLIST

  getWishlist(): string[] {

    const storedWishlist =localStorage.getItem(this.STORAGE_KEY);
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

  // ADD PRODUCT

  addItem(productId: string): void {
    const wishlist =this.getWishlist();
    if (wishlist.includes(productId)) {
      return;
    }
    wishlist.push(productId);
    this.saveWishlist(wishlist);
    this.toastservice.success("Product Added To Wishlist")
  }

  // REMOVE PRODUCT

  removeItem(productId: string): void {
    const wishlist =this.getWishlist();
    const updatedWishlist =wishlist.filter(
        id => id !== productId
    );
    this.saveWishlist(updatedWishlist);
    this.toastservice.success("Product Removed From Wishlist")
  }

  // CLEAR WISHLIST

  clearWishlist(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // SAVE

  private saveWishlist(items: string[]): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(items)
    );
  }
}