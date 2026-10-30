import { Routes } from '@angular/router';
import {NgChartsModule } from 'ng2-charts';
import { AdminLayoutComponent } from './layout/layout.component';


export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    providers: [NgChartsModule],

    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
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