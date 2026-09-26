import { AsyncPipe } from '@angular/common';

import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import { Store } from '@ngrx/store';

import {
  selectCartItemCount
} from '../../../store/cart/cart.selectors';

import {
  selectWishlistCount
} from '../../../store/wishlist/wishlist.selectors';

import {
  selectCurrentUser,
  selectIsAuthenticated
} from '../../../store/auth/auth.selectors';

import {
  logout
} from '../../../store/auth/auth.actions';


@Component({
  selector: 'app-navbar',

  standalone: true,

  imports: [
    RouterLink,
    AsyncPipe
  ],

  templateUrl: './navbar.component.html',

  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  private router =
    inject(Router);

  private store =
    inject(Store);


  // =====================================================
  // MOBILE MENU
  // =====================================================

  isMenuOpen =
    signal(false);

  isAccountMenuOpen =
    signal(false);


  // =====================================================
  // SEARCH
  // =====================================================

  searchTerm =
    signal('');


  // =====================================================
  // CART
  // =====================================================

  cartItemCount$ =
    this.store.select(
      selectCartItemCount
    );


  // =====================================================
  // WISHLIST
  // =====================================================

  wishlistCount$ =
    this.store.select(
      selectWishlistCount
    );


  // =====================================================
  // AUTHENTICATION
  // =====================================================

  isAuthenticated$ =
    this.store.select(
      selectIsAuthenticated
    );

  currentUser$ =
    this.store.select(
      selectCurrentUser
    );


  // =====================================================
  // MOBILE MENU
  // =====================================================

  toggleMenu(): void {

    this.isMenuOpen.update(
      value => !value
    );

  }


  closeMenu(): void {

    this.isMenuOpen.set(false);

  }


  // =====================================================
  // SEARCH
  // =====================================================

  search(): void {
    const term = this.searchTerm().trim();

    console.log('SEARCH BUTTON CLICKED');
    console.log('SEARCH TERM:', term);

    if (!term) {
      this.router.navigateByUrl('/shop');
      this.closeMenu();
      return;
    }

    const searchUrl = `/shop?search=${encodeURIComponent(term)}`;

    console.log('NAVIGATING TO:', searchUrl);

    this.router.navigateByUrl(searchUrl);

    this.closeMenu();
  }

  // =====================================================
  // ACCOUNT MENU
  // =====================================================

  toggleAccountMenu(): void {

    this.isAccountMenuOpen.update(
      value => !value
    );

  }


  closeAccountMenu(): void {

    this.isAccountMenuOpen.set(false);

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {

    this.store.dispatch(
      logout()
    );

    this.closeAccountMenu();

    this.router.navigate(
      ['/']
    );

  }

}