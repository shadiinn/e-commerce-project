import { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./features/checkout/checkout.component')
        .then(m => m.CheckoutComponent)
  }
];
