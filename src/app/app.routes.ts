import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { adminGuard } from './core/guards/admin.guard';
import { customerOnlyGuard } from './core/guards/customer-only.guard';

export const routes: Routes = [
  {
    path:'',
    redirectTo:'home',
    pathMatch:'full'
  },
  {
    path: 'home',
    canActivate: [customerOnlyGuard],
    loadComponent: () =>
      import ('./features/home/home.component')
        .then(m => m.HomeComponent)
  },

  {
    path: 'shop',
    canActivate: [customerOnlyGuard],
    loadComponent: () =>
      import('./features/shop/shop.component')
        .then(m => m.ShopComponent)
  },
  {
   path: 'products/:id',
    canActivate: [customerOnlyGuard],
    loadComponent: () =>
      import('./features/product-details/product-details.component')
        .then(m => m.ProductDetailsComponent)
  },

  {
    path: 'collection',
    canActivate: [customerOnlyGuard],
    loadComponent: () =>
      import('./features/collection/collection.component')
        .then(m => m.CollectionComponent)
  },

  {
    path: 'about',
    canActivate: [customerOnlyGuard],
    loadComponent: () =>
      import('./features/about/about.component')
        .then(m => m.AboutComponent)
  },

  {
    path: 'contact',
    canActivate: [customerOnlyGuard],
    loadComponent: () =>
      import('./features/contact/contact.component')
        .then(m => m.ContactComponent)
  },
  {
    path: 'cart',
    canActivate: [customerOnlyGuard],
    loadComponent: () =>
      import('./features/cart/cart.component')
        .then(m => m.CartComponent)
  },
  {
    path: 'wishlist',
    canActivate: [customerOnlyGuard],
    loadComponent: () =>
      import('./features/wishlist/wishlist.component')
        .then(m => m.WishlistComponent)
  },
  {
    path: 'checkout',
    canActivate: [customerOnlyGuard, authGuard],
    loadComponent: () =>
      import('./features/checkout/checkout.component')
        .then(m => m.CheckoutComponent)
  },
  {
    path: 'order-confirmation/:id',
    canActivate: [customerOnlyGuard],
    loadComponent: () =>
      import('./features/order-confirmation/order-confirmation.component')
        .then(m => m.OrderConfirmationComponent)
  },
  {
    path: 'orders',
    canActivate: [customerOnlyGuard, authGuard],
    loadComponent: () =>
      import('./features/orders/orders.component')
        .then(m => m.OrdersComponent)
  },
  {
    path: 'orders/:id',
    canActivate: [customerOnlyGuard, authGuard],
    loadComponent: () =>
      import('./features/order-details/order-details.component')
        .then(m => m.OrderDetailsComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import  ('./features/auth/auth.component') 
        .then(m => m.AuthComponent),
    canActivate: [customerOnlyGuard, guestGuard]
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/auth.component')
        .then(m => m.AuthComponent),
    canActivate: [customerOnlyGuard, guestGuard]
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/auth/auth.component')
        .then(m => m.AuthComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'account',
    canActivate: [customerOnlyGuard, authGuard],
    loadComponent: () =>
      import('./features/account/account.component')
        .then(m => m.AccountComponent)
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes')
        .then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
