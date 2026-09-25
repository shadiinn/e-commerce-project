import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import { RouterOutlet } from '@angular/router';

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


@Component({
  selector: 'app-root',

  standalone: true,

  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent
  ],

  templateUrl: './app.component.html',

  styleUrl: './app.component.css'
})
export class AppComponent
  implements OnInit {

  title = 'ecommerce-project';


  private store =
    inject(Store);


  // =====================================================
  // APPLICATION INITIALIZATION
  // =====================================================

  ngOnInit(): void {


    // ---------------------------------------------------
    // LOAD PRODUCTS
    // ---------------------------------------------------

    this.store.dispatch(
      loadProducts()
    );


    // ---------------------------------------------------
    // RESTORE AUTHENTICATION
    // ---------------------------------------------------

    this.store.dispatch(
      restoreAuth()
    );


    // ---------------------------------------------------
    // LOAD GUEST CART
    // ---------------------------------------------------

    this.store.dispatch(
      loadGuestCart()
    );

  }

}