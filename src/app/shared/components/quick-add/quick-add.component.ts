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


@Component({
  selector: 'app-quick-add',

  standalone: true,

  imports: [],

  templateUrl: './quick-add.component.html',

  styleUrl: './quick-add.component.css'
})
export class QuickAddComponent {

  private store = inject(Store);


  // =====================================================
  // PRODUCT
  // =====================================================

  product =
    input.required<Product>();


  // =====================================================
  // CLOSE EVENT
  // =====================================================

  close =
    output<void>();


  // =====================================================
  // AUTHENTICATION
  // =====================================================

  isAuthenticated$ =
    this.store.select(
      selectIsAuthenticated
    );


  // =====================================================
  // LOCAL UI STATE
  // =====================================================

  selectedVariantId =
    signal<string | null>(null);


  selectedSize =
    signal<string | null>(null);


  // =====================================================
  // AUTO SELECT SINGLE VARIANT
  // =====================================================

  constructor() {

    effect(
      () => {

        const product =
          this.product();

        const variants =
          product.variants;


        // -------------------------------------------------
        // No variants
        // -------------------------------------------------

        if (variants.length === 0) {

          this.selectedVariantId.set(null);

          this.selectedSize.set(null);

          return;

        }


        // -------------------------------------------------
        // ONLY ONE VARIANT
        // -------------------------------------------------
        //
        // Automatically select the only color.
        //
        // This makes the color button appear selected
        // and makes its sizes immediately available.
        //
        // -------------------------------------------------

        if (variants.length === 1) {

          const onlyVariant =
            variants[0];


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


  // =====================================================
  // SELECTED VARIANT
  // =====================================================

  selectedVariant =
    computed<ProductVariant | null>(() => {

      const variantId =
        this.selectedVariantId();


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


  // =====================================================
  // VARIANT USED FOR SIZE OPTIONS
  // =====================================================
  //
  // If a color is selected:
  //     use that variant.
  //
  // If no color is selected:
  //     use the first variant.
  //
  // Therefore the size options are always available.
  //
  // =====================================================

  sizeVariant =
    computed<ProductVariant | null>(() => {

      const selected =
        this.selectedVariant();


      if (selected) {

        return selected;

      }


      return (
        this.product()
          .variants[0] ?? null
      );

    });


  // =====================================================
  // AVAILABLE SIZES
  // =====================================================

  availableSizes =
    computed(() => {

      const variant =
        this.sizeVariant();


      if (!variant) {

        return [];

      }


      return variant.sizes;

    });


  // =====================================================
  // SELECT VARIANT
  // =====================================================

  selectVariant(
    variantId: string
  ): void {

    this.selectedVariantId.set(
      variantId
    );


    // -------------------------------------------------
    // Reset size whenever the color changes.
    // -------------------------------------------------

    this.selectedSize.set(null);

  }


  // =====================================================
  // SELECT SIZE
  // =====================================================

  selectSize(
    size: string
  ): void {

    const variant =
      this.sizeVariant();


    if (!variant) {

      return;

    }


    const selectedSize =
      variant.sizes.find(
        item =>
          item.size === size
      );


    // -------------------------------------------------
    // Do not allow selecting an out-of-stock size.
    // -------------------------------------------------

    if (
      !selectedSize ||
      selectedSize.stock <= 0
    ) {

      return;

    }


    this.selectedSize.set(
      size
    );

  }


  // =====================================================
  // GET SELECTED SIZE STOCK
  // =====================================================

  getSelectedSizeStock(): number {

    const variant =
      this.sizeVariant();

    const size =
      this.selectedSize();


    if (
      !variant ||
      !size
    ) {

      return 0;

    }


    return (
      variant.sizes.find(
        item =>
          item.size === size
      )?.stock ?? 0
    );

  }


  // =====================================================
  // CHECK PRODUCT STOCK
  // =====================================================

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


  // =====================================================
  // ADD TO CART
  // =====================================================

  addProductToCart(): void {

    const variant =
      this.selectedVariant();

    const size =
      this.selectedSize();


    // ---------------------------------------------------
    // VALIDATE VARIANT
    // ---------------------------------------------------

    if (!variant) {

      return;

    }


    // ---------------------------------------------------
    // VALIDATE SIZE
    // ---------------------------------------------------

    if (!size) {

      return;

    }


    // ---------------------------------------------------
    // VALIDATE STOCK
    // ---------------------------------------------------

    const selectedSizeStock =
      this.getSelectedSizeStock();


    if (
      selectedSizeStock <= 0
    ) {

      return;

    }


    // ---------------------------------------------------
    // CHECK AUTHENTICATION
    // ---------------------------------------------------

    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(
        isAuthenticated => {


          // ===============================================
          // LOGGED-IN USER
          // ===============================================

          if (isAuthenticated) {

            this.store.dispatch(
              addToCart({

                product:
                  this.product(),

                variantId:
                  variant.id,

                size

              })
            );

          }


          // ===============================================
          // GUEST USER
          // ===============================================

          else {

            this.store.dispatch(
              addGuestCartItem({

                productId:
                  this.product().id,

                variantId:
                  variant.id,

                size

              })
            );

          }


          // -------------------------------------------------
          // CLOSE QUICK ADD
          // -------------------------------------------------

          this.close.emit();

        }
      );

  }


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  closeModal(): void {

    this.close.emit();

  }

}