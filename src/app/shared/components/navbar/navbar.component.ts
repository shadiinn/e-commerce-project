import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectCartItemCount } from '../../../store/cart/cart.selectors';
import { selectWishlistCount } from '../../../store/wishlist/wishlist.selectors';
import { selectCurrentUser, selectIsAuthenticated } from '../../../store/auth/auth.selectors';
import { logout } from '../../../store/auth/auth.actions';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink,AsyncPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  private router = inject(Router);
  private store = inject(Store);



  // Mobile menu state
  isMenuOpen = signal(false);

  isAccountMenuOpen = signal(false);

  // Search state
  searchTerm = signal('');

  cartItemCount$ = 
    this.store.select(selectCartItemCount);

  wishlistCount$ = 
    this.store.select(selectWishlistCount);

  isAuthenticated$ =
    this.store.select(selectIsAuthenticated);

  currentUser$ =
    this.store.select(selectCurrentUser);

  // ================================
  // MOBILE MENU
  // ================================

  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  // ================================
  // SEARCH
  // ================================

  search(): void {

    const term = this.searchTerm().trim();

    if (!term) {
      this.router.navigate(['/shop']);
      return;
    }

    this.router.navigate(['/shop'], {
      queryParams: {
        search: term
      }
    });

    // Close mobile menu after searching
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

  logout(): void {
    this.store.dispatch(logout());

    this.closeAccountMenu();

    this.router.navigate(['/']);
  }
}