import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink,
  Router
} from '@angular/router';

import { AsyncPipe } from '@angular/common';

import { Store } from '@ngrx/store';

import { Product } from '../../core/models/product.model';

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
  // SELECTED SIZE
  // =====================================================

  selectedSize =
    signal<string | null>(null);


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
      // SET FIRST PRODUCT IMAGE
      // ---------------------------------------------------

      this.product$.subscribe(product => {

        if (product) {

          this.selectedImage.set(
            product.images[0]
          );

        }

      });

    });

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

    this.selectedSize.set(
      size
    );

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart(
    product: Product
  ): void {

    const size =
      this.selectedSize();


    // ---------------------------------------------------
    // VALIDATE SIZE
    // ---------------------------------------------------

    if (!size) {
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

    const size =
      this.selectedSize();


    // ---------------------------------------------------
    // SIZE IS REQUIRED
    // ---------------------------------------------------

    if (!size) {
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