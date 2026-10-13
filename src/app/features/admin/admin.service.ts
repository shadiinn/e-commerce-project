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
  buildStatusChange,
  getNextStatuses
} from '../../core/utils/order.status';

// A user WITHOUT the password: the admin pages never keep passwords
export type AdminUser = Omit<User, 'password'>;

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

  changeOrderStatus(
    order: Order,
    nextStatus: OrderStatus,
    cancellationReason = ''
  ): void {
    if (!getNextStatuses(order.orderStatus).includes(nextStatus)) {
      this.toast.warning('This order cannot move to that status.');
      return;
    }

    if (nextStatus === 'cancelled' && !cancellationReason.trim()) {
      this.toast.warning('Choose a reason before cancelling the order.');
      return;
    }

    const givesStockBack = nextStatus === 'cancelled' && order.stockReduced === true;
    const changes: Partial<Order> = {
      ...buildStatusChange(order, nextStatus),
      ...(nextStatus === 'cancelled' ? {
        cancellationReason: cancellationReason.trim(),
        cancelledBy: 'admin' as const
      } : {})
    };

    this.orderService.updateOrder(order.id, changes).pipe(
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

  // Activate/deactivate customer accounts. Missing active flags on old records mean active.
  setUserActive(userId: string, active: boolean): void {
    this.authService.updateUser(userId, { active }).subscribe({
      next: updated => {
        const { password: _password, ...safeUser } = updated;
        this.users.update(list => list.map(user => user.id === userId ? safeUser : user));
        this.toast.success(active ? 'Customer account activated.' : 'Customer account deactivated.');
      },
      error: () => this.toast.error('Could not update this account. Please try again.')
    });
  }

  // Remove a product from the catalogue and refresh the shared product state.
  deleteProduct(id: string): Observable<void> {
    return this.productService.deleteProduct(id).pipe(
      tap(() => this.store.dispatch(loadProducts()))
    );
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