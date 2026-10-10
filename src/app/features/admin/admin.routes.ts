import { Routes } from '@angular/router';
import {NgChartsModule } from 'ng2-charts';
import { AdminLayoutComponent } from './layout/layout.component';

/*
  Child routes of /admin (loaded lazily from app.routes.ts, guarded by adminGuard).

  Every admin page is shown INSIDE AdminLayoutComponent (sidebar + header), because
  it is the parent route with the <router-outlet> in its template.

  Adding a page later (for example orders):
    1. add the route below
    2. set  ready: true  for it in navItems (layout/admin-layout.component.ts)
*/
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,

    // Registers Chart.js (the chart types, scales, tooltips ...) for the admin pages.
    // It is done HERE, not in app.config.ts, so the chart code is part of the lazy admin
    // download and customers never load it.
    providers: [NgChartsModule],

    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./dashboard/dashboard.component')
            .then(m => m.AdminDashboardComponent)
      },

      {
        path: 'inventory',
        loadComponent: () =>
          import('./inventory/inventory.component')
            .then(m => m.AdminInventoryComponent)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/orders.component')
            .then(m => m.AdminOrdersComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/products.component')
            .then(m => m.AdminProductsComponent)
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./products/product-form/product.form.component')
            .then(m => m.AdminProductFormComponent)
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./products/product-form/product.form.component')
            .then(m => m.AdminProductFormComponent)
      },

      {
        path: 'users',
        loadComponent: () =>
          import('./users/users.component')
            .then(m => m.AdminUsersComponent)
      },

      // an unknown /admin/... address goes back to the dashboard
      { path: '**', redirectTo: '' }
    ]
  }
];