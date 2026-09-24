import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
     {
    path: '',
    loadComponent: () =>
      import ('./features/home/home.component')
        .then(m => m.HomeComponent)
  },

  {
    path: 'shop',
    loadComponent: () =>
      import('./features/shop/shop.component')
        .then(m => m.ShopComponent)
  },
  {
   path: 'products/:id',
    loadComponent: () =>
      import('./features/product-details/product-details.component')
        .then(m => m.ProductDetailsComponent)
  },

  {
    path: 'collection',
    loadComponent: () =>
      import('./features/collection/collection.component')
        .then(m => m.CollectionComponent)
  },

  {
    path: 'about',
    loadComponent: () =>
      import('./features/about/about.component')
        .then(m => m.AboutComponent)
  },

  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component')
        .then(m => m.ContactComponent)
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/cart.component')
        .then(m => m.CartComponent)
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./features/wishlist/wishlist.component')
        .then(m => m.WishlistComponent)
  },
  {
    path: 'checkout',
    canActivate:[authGuard],
    loadComponent: () =>
      import('./features/checkout/checkout.component')
        .then(m => m.CheckoutComponent)
  },
  {
    path: 'order-confirmation/:id',
    loadComponent: () =>
      import('./features/order-confirmation/order-confirmation.component')
        .then(m => m.OrderConfirmationComponent)
  },
  {
    path: 'orders',
    canActivate:[authGuard],
    loadComponent: () =>
      import('./features/orders/orders.component')
        .then(m => m.OrdersComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component')
        .then(m => m.RegisterComponent)
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/account.component')
        .then(m => m.AccountComponent)
  }
];
