import {
  Component,
  input,
  output,
  signal,
  inject,
  computed,
  effect
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Product,
  ProductVariant
} from '../../../core/models/product.model';
import {
  addToCart,
  addGuestCartItem
} from '../../../store/cart/cart.actions';
import {
  selectIsAuthenticated
} from '../../../store/auth/auth.selectors';
import { take } from 'rxjs';
import { ToastService } from '../../../core/services/toast/toast.service';
import {
  selectActiveCartItems
} from '../../../store/cart/cart.selectors';
import {
  evaluateAddToCart,
  getSizeStock
} from '../../../core/utils/cart.limits';

@Component({
  selector: 'app-quick-add',
  standalone: true,
  imports: [],
  templateUrl: './quick-add.component.html',
  styleUrl: './quick-add.component.css'
})
export class QuickAddComponent {

  private store = inject(Store);
  private toastService = inject(ToastService);

  product = input.required<Product>();

  close =output<void>();

  // AUTHENTICATION

  isAuthenticated$ =
    this.store.select(
      selectIsAuthenticated
    );

  // LOCAL UI STATE

  selectedVariantId =signal<string | null>(null);

  selectedSize =signal<string | null>(null);

  // AUTO SELECT SINGLE VARIANT

  constructor() {
    effect(
      () => {
        const product =this.product();
        const variants =product.variants;

        // No variants
        if (variants.length === 0) {
          this.selectedVariantId.set(null);
          this.selectedSize.set(null);
          return;
        }

        // ONLY ONE VARIANT
        if (variants.length === 1) {
          const onlyVariant =variants[0];
          this.selectedVariantId.set(
            onlyVariant.id
          );
        }
      },
      {
        allowSignalWrites: true
      }
    );

  }

  // SELECTED VARIANT

  selectedVariant =computed<ProductVariant | null>(() => {
      const variantId =this.selectedVariantId();
      if (!variantId) {
        return null;
      }
      return (
        this.product()
          .variants
          .find(
            variant =>
              variant.id === variantId
          ) ?? null
      );

    });

  sizeVariant =computed<ProductVariant | null>(() => {
      const selected =this.selectedVariant();
      if (selected) {
        return selected;
      }
      return (
        this.product()
          .variants[0] ?? null
      );
    });

  availableSizes =computed(() => {
      const variant =this.sizeVariant();
      if (!variant) {
        return [];
      }
      return variant.sizes;
    });

  // SELECT VARIANT

  selectVariant(variantId: string): void {
    this.selectedVariantId.set(
      variantId
    );

    // Reset size whenever the color changes.
  
    this.selectedSize.set(null);
  }
  // SELECT SIZE

  selectSize(size: string): void {
    const variant =this.sizeVariant();
    if (!variant) {
      return;
    }
    const selectedSize =
      variant.sizes.find(
        item =>
          item.size === size
      );

    // Do not allow selecting an out-of-stock size.

    if (!selectedSize || selectedSize.stock <= 0) {
      return;
    }
    this.selectedSize.set(
      size
    );
  }

  // GET SELECTED SIZE STOCK

  getSelectedSizeStock(): number {
    const variant =this.sizeVariant();
    const size =this.selectedSize();
    if (!variant || !size) {
      return 0;
    }
    return (
      variant.sizes.find(
        item =>
          item.size === size
      )?.stock ?? 0
    );
  }

  // CHECK PRODUCT STOCK

  get hasStock(): boolean {

    return this.product()
      .variants
      .some(
        variant =>
          variant.sizes.some(
            size =>
              size.stock > 0
          )
      );
  }

  // ADD TO CART

  addProductToCart(): void {
    const variant =this.selectedVariant();
    const size =this.selectedSize();

    if (!variant) {
      return;
    }
    if (!size) {
      return;
    }

    // VALIDATE STOCK
  
    const selectedSizeStock =this.getSelectedSizeStock();
    if (selectedSizeStock <= 0 ) {
      return;
    }

    // CHECK CART LIMITS (same item quantity + distinct products)
    // before dispatching, so we can show the right message.

    this.store
      .select(selectActiveCartItems)
      .pipe(take(1))
      .subscribe(
        cartItems => {

          const limitCheck =
            evaluateAddToCart(
              cartItems,
              this.product().id,
              variant.id,
              size,
              selectedSizeStock
            );

          if (!limitCheck.allowed) {

            this.toastService.warning(
              limitCheck.message
            );

            this.close.emit();

            return;

          }

          // CHECK AUTHENTICATION

          this.isAuthenticated$
            .pipe(take(1))
            .subscribe(
              isAuthenticated => {

                // LOGGED-IN USER

                if (isAuthenticated) {
                  this.store.dispatch(
                    addToCart({
                      product:this.product(),
                      variantId:variant.id,
                      size
                    })
                  );
                  this.toastService.success('Added to cart');
                }

                // GUEST USER
                else {
                  this.store.dispatch(
                    addGuestCartItem({
                      productId:this.product().id,
                      variantId:variant.id,
                      size
                    })
                  );
                  this.toastService.success('Added to cart');
                }

                // CLOSE QUICK ADD

                this.close.emit();
              }
            );

        }
      );
  }

  // CLOSE MODAL

  closeModal(): void {
    this.close.emit();
  }
}