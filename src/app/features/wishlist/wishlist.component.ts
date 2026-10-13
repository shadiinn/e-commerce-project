import { AsyncPipe } from '@angular/common';

import {
  Component,
  inject,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { Store } from '@ngrx/store';

import {
  selectActiveWishlistItemsWithProducts,
  selectWishlistCount
} from '../../store/wishlist/wishlist.selectors';

import {
  toggleWishlist,
  clearWishlist,
  clearGuestWishlist
} from '../../store/wishlist/wishlist.actions';

import { Product } from '../../core/models/product.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-wishlist',

  standalone: true,

  imports: [
    AsyncPipe,
    RouterLink,
    ConfirmDialogComponent
  ],

  templateUrl: './wishlist.component.html',

  styleUrl: './wishlist.component.css'
})
export class WishlistComponent {


  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private store = inject(Store);

  showClearConfirmation = signal(false);

  // =====================================================
  // WISHLIST
  // =====================================================

  wishlistItems$ =
    this.store.select(
      selectActiveWishlistItemsWithProducts
    );


  wishlistCount$ =
    this.store.select(
      selectWishlistCount
    );


  // =====================================================
  // REMOVE FROM WISHLIST
  // =====================================================

  removeFromWishlist(
    product: Product
  ): void {

    this.store.dispatch(
      toggleWishlist({

        product

      })
    );

  }


  // =====================================================
  // CLEAR WISHLIST
  // =====================================================


  openClearConfirmation(): void {
    this.showClearConfirmation.set(true);
  }

  confirmClearWishlist(): void {
    this.store.dispatch(clearWishlist());
    this.store.dispatch(clearGuestWishlist());

    this.showClearConfirmation.set(false);
  }

  cancelClearWishlist(): void {
    this.showClearConfirmation.set(false);
  }
}