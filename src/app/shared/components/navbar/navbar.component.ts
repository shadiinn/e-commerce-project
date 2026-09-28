import { AsyncPipe } from '@angular/common';

import {
  Component,
  ElementRef,
  HostListener,
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

  private router = inject(Router);
  private store = inject(Store);
  private elementRef = inject(ElementRef);

  isMenuOpen = signal(false);
  isAccountMenuOpen = signal(false);

  searchTerm = signal('');


  cartItemCount$ =
    this.store.select(
      selectCartItemCount
    );

  wishlistCount$ =
    this.store.select(
      selectWishlistCount
    );

  isAuthenticated$ =
    this.store.select(
      selectIsAuthenticated
    );

  currentUser$ =
    this.store.select(
      selectCurrentUser
    );


  toggleMenu(): void {

    this.isMenuOpen.update(
      value => !value
    );

  }


  closeMenu(): void {

    this.isMenuOpen.set(false);

  }


  search(): void {

    const term = this.searchTerm().trim();

    if (!term) {

      this.router.navigateByUrl('/shop');

      this.closeMenu();

      return;
    }

    const searchUrl =
      `/shop?search=${encodeURIComponent(term)}`;

    this.router.navigateByUrl(searchUrl);

    this.closeMenu();

  }


  toggleAccountMenu(): void {

    this.isAccountMenuOpen.update(
      value => !value
    );

  }


  closeAccountMenu(): void {

    this.isAccountMenuOpen.set(false);

  }


  /*
   * Close account menu when clicking
   * anywhere outside the navbar.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {

    const clickedInside =
      this.elementRef.nativeElement.contains(
        event.target
      );

    if (!clickedInside) {

      this.closeAccountMenu();

    }

  }


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