import {
  Component,
  inject,
  OnInit,
  signal,
  computed
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink,
  Router
} from '@angular/router';

import { AsyncPipe } from '@angular/common';

import { Store } from '@ngrx/store';

import {
  Product,
  ProductVariant
} from '../../core/models/product.model';

import {
  addToCart,
  addGuestCartItem
} from '../../store/cart/cart.actions';

import {
  startCheckout
} from '../../store/checkout/checkout.actions';

import {
  toggleWishlist
} from '../../store/wishlist/wishlist.actions';

import {
  selectIsProductInWishlist
} from '../../store/wishlist/wishlist.selectors';

import {
  selectProductById
} from '../../store/products/products.selectors';

import {
  selectIsAuthenticated
} from '../../store/auth/auth.selectors';

import {
  Observable,
  take
} from 'rxjs';


@Component({
  selector: 'app-product-details',

  standalone: true,

  imports: [
    RouterLink,
    AsyncPipe
  ],

  templateUrl: './product-details.component.html',

  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent
  implements OnInit {


  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private store = inject(Store);

  private route = inject(ActivatedRoute);

  private router = inject(Router);


  // =====================================================
  // PRODUCT
  // =====================================================

  productId = '';

  product$ =
    this.store.select(
      selectProductById('')
    );


  // =====================================================
  // AUTHENTICATION
  // =====================================================

  isAuthenticated$ =
    this.store.select(
      selectIsAuthenticated
    );


  // =====================================================
  // WISHLIST
  // =====================================================

  isWishlisted$!: Observable<boolean>;


  // =====================================================
  // SELECTED IMAGE
  // =====================================================

  selectedImage =
    signal('');


  // =====================================================
  // SELECTED VARIANT
  // =====================================================

  selectedVariantId =
    signal<string | null>(null);


  // =====================================================
  // SELECTED SIZE
  // =====================================================

  selectedSize =
    signal<string | null>(null);


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

      return this.currentProduct?.variants.find(
        variant =>
          variant.id === variantId
      ) ?? null;

    });


  // =====================================================
  // AVAILABLE SIZES
  // =====================================================

  availableSizes =
    computed(() => {

      const variant =
        this.selectedVariant();

      if (!variant) {
        return [];
      }

      return variant.sizes;

    });


  // =====================================================
  // CURRENT PRODUCT
  // =====================================================

  private currentProduct: Product | null = null;


  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      this.productId =
        params.get('id') ?? '';


      // ---------------------------------------------------
      // LOAD PRODUCT
      // ---------------------------------------------------

      this.product$ =
        this.store.select(
          selectProductById(
            this.productId
          )
        );


      // ---------------------------------------------------
      // LOAD WISHLIST STATUS
      // ---------------------------------------------------

      this.isWishlisted$ =
        this.store.select(
          selectIsProductInWishlist(
            this.productId
          )
        );


      // ---------------------------------------------------
      // PRODUCT DATA
      // ---------------------------------------------------

      this.product$.subscribe(product => {

        if (!product) {
          return;
        }

        this.currentProduct =
          product;


        // -------------------------------------------------
        // SELECT FIRST VARIANT
        // -------------------------------------------------

        const firstVariant =
          product.variants[0];

        if (!firstVariant) {
          return;
        }


        this.selectedVariantId.set(
          firstVariant.id
        );


        // -------------------------------------------------
        // SELECT FIRST IMAGE
        // -------------------------------------------------

        const firstImage =
          firstVariant.images[0];

        if (firstImage) {

          this.selectedImage.set(
            firstImage
          );

        }


        // -------------------------------------------------
        // RESET SIZE
        // -------------------------------------------------

        this.selectedSize.set(null);

      });

    });

  }


  // =====================================================
  // SELECT VARIANT
  // =====================================================

  selectVariant(
    variant: ProductVariant
  ): void {

    this.selectedVariantId.set(
      variant.id
    );


    // -----------------------------------------------------
    // RESET SIZE WHEN COLOR CHANGES
    // -----------------------------------------------------

    this.selectedSize.set(null);


    // -----------------------------------------------------
    // CHANGE IMAGE TO FIRST VARIANT IMAGE
    // -----------------------------------------------------

    const firstImage =
      variant.images[0];

    if (firstImage) {

      this.selectedImage.set(
        firstImage
      );

    }

  }


  // =====================================================
  // SELECT IMAGE
  // =====================================================

  selectImage(
    image: string
  ): void {

    this.selectedImage.set(
      image
    );

  }


  // =====================================================
  // SELECT SIZE
  // =====================================================

  selectSize(
    size: string
  ): void {

    const variant =
      this.selectedVariant();

    if (!variant) {
      return;
    }


    const selectedSize =
      variant.sizes.find(
        item =>
          item.size === size
      );


    // -----------------------------------------------------
    // DO NOT SELECT OUT-OF-STOCK SIZE
    // -----------------------------------------------------

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
  // SELECTED SIZE STOCK
  // =====================================================

  getSelectedSizeStock(): number {

    const variant =
      this.selectedVariant();

    const size =
      this.selectedSize();


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


  // =====================================================
  // TOTAL PRODUCT STOCK
  // =====================================================

  getTotalStock(
    product: Product
  ): number {

    return product.variants.reduce(
      (
        total,
        variant
      ) => {

        return total +
          variant.sizes.reduce(
            (
              variantTotal,
              size
            ) => {

              return variantTotal +
                size.stock;

            },
            0
          );

      },
      0
    );

  }


  // =====================================================
  // PRODUCT HAS STOCK
  // =====================================================

  hasStock(
    product: Product
  ): boolean {

    return this.getTotalStock(product) > 0;

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart(
    product: Product
  ): void {

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


    if (selectedSizeStock <= 0) {
      return;
    }


    // ---------------------------------------------------
    // CHECK AUTHENTICATION
    // ---------------------------------------------------

    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(isAuthenticated => {


        // ===============================================
        // LOGGED-IN USER
        // ===============================================

        if (isAuthenticated) {

          this.store.dispatch(
            addToCart({

              product,

              variantId:
                variant.id,

              size

            })
          );

          return;

        }


        // ===============================================
        // GUEST USER
        // ===============================================

        this.store.dispatch(
          addGuestCartItem({

            productId:
              product.id,

            variantId:
              variant.id,

            size

          })
        );

      });

  }


  // =====================================================
  // BUY NOW
  // =====================================================

  buyNow(
    product: Product
  ): void {

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


    if (selectedSizeStock <= 0) {
      return;
    }


    // ---------------------------------------------------
    // START CHECKOUT
    // ---------------------------------------------------

    this.store.dispatch(
      startCheckout({

        mode: 'buy-now',

        items: [

          {
            productId:
              product.id,

            variantId:
              variant.id,

            size,

            quantity: 1

          }

        ]

      })
    );


    // ---------------------------------------------------
    // NAVIGATE TO CHECKOUT
    // ---------------------------------------------------

    this.router.navigate([
      '/checkout'
    ]);

  }


  // =====================================================
  // TOGGLE WISHLIST
  // =====================================================

  toggleWishlist(
    product: Product
  ): void {

    this.store.dispatch(
      toggleWishlist({

        product

      })
    );

  }

}