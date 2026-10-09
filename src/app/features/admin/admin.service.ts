import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';

import { Order } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';
import { User } from '../../core/models/user.model';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { loadProducts } from '../../store/products/products.actions';
import {
  OrderStatus,
  ORDER_STATUS_LABELS,
  buildStatusChange
} from '../../core/utils/order.status';

// A user WITHOUT the password: the admin pages never keep passwords
export type AdminUser = Omit<User, 'password'>;

/*
  The data of the admin pages (all orders and all users), kept in signals.

  It is loaded once when the admin area opens (AdminLayoutComponent) and is shared by
  the dashboard and the orders pages. So when an order's status is changed on the
  orders page, the dashboard charts update by themselves.

  Admin-only data does not need NgRx: the customer pages never use it.
*/
@Injectable({ providedIn: 'root' })
export class AdminDataService {

  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private store = inject(Store);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  orders = signal<Order[]>([]);
  users = signal<AdminUser[]>([]);
  loading = signal(false);
  error = signal('');

  // Loads all orders and all users together
  load(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      orders: this.orderService.getAllOrders(),
      users: this.authService.getAllUsers()
    }).subscribe({
      next: ({ orders, users }) => {
        this.orders.set(orders);
        // remove the password of every user right away
        this.users.set(users.map(({ password: _password, ...user }) => user));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the admin data. Is json-server running?');
        this.loading.set(false);
      }
    });
  }

  // Moves an order to a new status (the rules are checked by the pages, see order-status.ts).
  // Cancelling an order also gives its pieces back to the stock, but only when the order
  // took them out (stockReduced). Older orders never did, so they must not add stock.
  changeOrderStatus(order: Order, nextStatus: OrderStatus): void {
    const givesStockBack = nextStatus === 'cancelled' && order.stockReduced === true;

    this.orderService.updateOrder(order.id, buildStatusChange(order, nextStatus)).pipe(
      switchMap(updatedOrder => {
        if (!givesStockBack) return of(updatedOrder);

        return this.productService.adjustStock(order.items, 1).pipe(
          // the shop and the product pages must show the new stock
          tap(() => this.store.dispatch(loadProducts())),
          catchError(() => {
            this.toast.warning('The order is cancelled, but its stock could not be given back. Please check it on the Products page.');
            return of(null);
          }),
          map(() => updatedOrder)
        );
      })
    ).subscribe({
      next: updatedOrder => {
        this.orders.update(list => list.map(item => (item.id === updatedOrder.id ? updatedOrder : item)));

        this.toast.success(
          `Order ${order.orderNumber} is now ${ORDER_STATUS_LABELS[nextStatus]}.` +
          (givesStockBack ? ' The pieces were added back to the stock.' : '')
        );
      },
      error: () => this.toast.error('Could not update the order. Please try again.')
    });
  }

  // Saves a new product (isNew = true) or a changed one.
  // The products themselves live in the products slice of the store (the shop uses them
  // too), so after saving the products are loaded again: the shop and every admin page
  // then show the change.
  saveProduct(product: Product, isNew: boolean): Observable<Product> {
    const request = isNew
      ? this.productService.createProduct(product)
      : this.productService.replaceProduct(product);

    return request.pipe(tap(() => this.store.dispatch(loadProducts())));
  }

  // 6499 -> "₹6,499"  (used by all admin pages, so the money looks the same everywhere)
  money(value: number): string {
    return '₹' + Math.round(value).toLocaleString('en-IN');
  }

  // Called when the admin area is closed
  clear(): void {
    this.orders.set([]);
    this.users.set([]);
  }
}