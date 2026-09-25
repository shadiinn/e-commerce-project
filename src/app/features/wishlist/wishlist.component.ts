import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import {
  selectActiveWishlistItemsWithProducts,
  selectWishlistCount
} from '../../store/wishlist/wishlist.selectors';

import {
  toggleWishlist,
  clearWishlist
} from '../../store/wishlist/wishlist.actions';

import { Product } from '../../core/models/product.model';


@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent {

  private store = inject(Store);


  wishlistItems$ =
    this.store.select(
      selectActiveWishlistItemsWithProducts
    );


  wishlistCount$ =
    this.store.select(
      selectWishlistCount
    );


  removeFromWishlist(
    product: Product
  ): void {

    this.store.dispatch(
      toggleWishlist({
        product
      })
    );

  }


  clearWishlist(): void {

    this.store.dispatch(
      clearWishlist()
    );

  }

}