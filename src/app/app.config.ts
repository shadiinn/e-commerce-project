import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { productsReducer } from './store/products/products.reducer';
import { provideEffects } from '@ngrx/effects';
import { ProductsEffects } from './store/products/products.effects';
import { cartReducer } from './store/cart/cart.reducer';
import { wishlistReducer } from './store/wishlist/wishlist.reducer';
import { CartEffects } from './store/cart/cart.effects';
import { WishlistEffects } from './store/wishlist/wishlist.effects';
import { checkoutReducer } from './store/checkout/checkout.reducer';
import { ordersReducer } from './store/orders/orders.reducer';
import { OrdersEffects } from './store/orders/orders.effects';
import { authReducer } from './store/auth/auth.reducer';
import { AuthEffects } from './store/auth/auth.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(),
    provideStore({
      products:productsReducer,
      cart: cartReducer,
      wishlist: wishlistReducer,
      checkout: checkoutReducer,
      orders: ordersReducer,
      auth: authReducer
    }),
    provideEffects(ProductsEffects,CartEffects,WishlistEffects,OrdersEffects,AuthEffects)
  ]
};
