import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import {
  selectCartItemsWithProducts,
  selectCartItemCount,
  selectCartSubtotal
} from '../../store/cart/cart.selectors';
import {
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  increaseGuestQuantity,
  decreaseGuestQuantity,
  removeGuestItem,
  clearGuestCart
} from '../../store/cart/cart.actions';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { startCheckout } from '../../store/checkout/checkout.actions';
import { checkQuantityLimit, getSizeStock, quantityLimitNote } from '../../core/utils/cart.limits';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {

  private store = inject(Store);
  private router = inject(Router);

  private isAuthenticated = toSignal(this.store.select(selectIsAuthenticated), { initialValue: false });

  items = toSignal(this.store.select(selectCartItemsWithProducts), { initialValue: [] });
  count = toSignal(this.store.select(selectCartItemCount), { initialValue: 0 });
  subtotal = toSignal(this.store.select(selectCartSubtotal), { initialValue: 0 });

  // id of the cart item waiting for the "remove?" confirmation
  itemToRemove = signal<string | null>(null);


  // ---------- STOCK LIMITS ----------

  private limitOf(item: any) {
    const stock = getSizeStock(item.product, item.variant?.id, item.size);
    return { stock, limit: checkQuantityLimit(item.quantity, stock) };
  }

  canIncrease(item: any): boolean {
    return this.limitOf(item).limit === 'OK';
  }

  // Message shown when the item can't be increased further ('' when it still can)
  limitNote(item: any): string {
    const { stock, limit } = this.limitOf(item);
    return limit === 'OK' ? '' : quantityLimitNote(limit, stock);
  }


  // ---------- CART ACTIONS ----------

  increase(cartItemId: string): void {
    this.store.dispatch(
      this.isAuthenticated() ? increaseQuantity({ cartItemId }) : increaseGuestQuantity({ cartItemId })
    );
  }

  // Going below 1 asks for confirmation instead of silently removing the item
  decrease(item: { id?: string; quantity: number }): void {
    const cartItemId = item.id!;

    if (item.quantity > 1) {
      this.store.dispatch(
        this.isAuthenticated() ? decreaseQuantity({ cartItemId }) : decreaseGuestQuantity({ cartItemId })
      );
    } else {
      this.itemToRemove.set(cartItemId);
    }
  }

  remove(cartItemId: string): void {
    this.store.dispatch(
      this.isAuthenticated() ? removeFromCart({ cartItemId }) : removeGuestItem({ cartItemId })
    );
  }

  confirmRemove(): void {
    const cartItemId = this.itemToRemove();
    if (cartItemId) this.remove(cartItemId);
    this.itemToRemove.set(null);
  }

  clearCart(): void {
    this.store.dispatch(this.isAuthenticated() ? clearCart() : clearGuestCart());
  }

  proceedToCheckout(): void {
    const items = this.items();
    if (!items.length) return;

    this.store.dispatch(
      startCheckout({
        mode: 'cart',
        items: items.map(item => ({
          productId: item.product.id,
          variantId: item.variant.id,
          size: item.size,
          quantity: item.quantity
        }))
      })
    );

    this.router.navigate(['/checkout']);
  }
}