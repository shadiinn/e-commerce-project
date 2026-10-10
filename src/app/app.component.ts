import {
  Component,
  inject
} from '@angular/core';

import {
  Router,
  RouterOutlet
} from '@angular/router';

import {
  NavbarComponent
} from './shared/components/navbar/navbar.component';

import {
  FooterComponent
} from './shared/components/footer/footer.component';

import {
  Store
} from '@ngrx/store';

import {
  loadProducts
} from './store/products/products.actions';

import {
  restoreAuth
} from './store/auth/auth.actions';

import {
  loadGuestCart
} from './store/cart/cart.actions';

import {
  loadGuestWishlist
} from './store/wishlist/wishlist.actions';
import { ToastComponent } from './shared/components/toast/toast.component';


@Component({
  selector: 'app-root',

  standalone: true,

  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,ToastComponent
  ],

  templateUrl: './app.component.html',

  styleUrl: './app.component.css'
})
export class AppComponent {

  private store =
    inject(Store);

  router =
    inject(Router);


  constructor() {

    this.store.dispatch(
      loadProducts()
    );

    this.store.dispatch(
      restoreAuth()
    );

    this.store.dispatch(
      loadGuestCart()
    );

    this.store.dispatch(
      loadGuestWishlist()
    );

  }


  // Pages that have their own full-screen layout: no customer navbar or footer.
  //   login / register  -> the auth screen
  //   /admin...         -> the admin layout has its own sidebar and header
  hideSiteShell(): boolean {
    const url = this.router.url;

    return (
      url === '/login' ||
      url === '/register' ||
      url.startsWith('/admin')
    );
  }

}