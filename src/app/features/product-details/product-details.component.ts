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

import { addToCart } from '../../store/cart/cart.actions';

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

import { Observable } from 'rxjs';

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

  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  productId = '';

  isWishlisted$!: Observable<boolean>;

  product$ = this.store.select(
    selectProductById('')
  );

  // Currently selected image
  selectedImage = signal('');

  // Currently selected size
  selectedSize = signal<string | null>(null);

  // Currently selected color
  selectedColor = signal<string | null>(null);


  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      this.productId =
        params.get('id') ?? '';

      this.product$ =
        this.store.select(
          selectProductById(this.productId)
        );

      this.isWishlisted$ =
        this.store.select(
          selectIsProductInWishlist(
            this.productId
          )
        );


      // Get product once and set first image
      this.product$.subscribe(product => {

        if (product) {

          this.selectedImage.set(
            product.images[0]
          );

        }

      });

    });

  }


  selectImage(image: string): void {

    this.selectedImage.set(image);

  }


  selectSize(size: string): void {

    this.selectedSize.set(size);

  }


  selectColor(color: string): void {

    this.selectedColor.set(color);

  }


  addToCart(product: Product): void {

    const size =
      this.selectedSize();

    const color =
      this.selectedColor();


    if (!size || !color) {
      return;
    }


    this.store.dispatch(
      addToCart({
        product,
        size,
        color
      })
    );

  }


  buyNow(product: Product): void {

    const size =
      this.selectedSize();

    const color =
      this.selectedColor();


    // Size and color are required
    if (!size || !color) {
      return;
    }


    // Start checkout directly
    this.store.dispatch(
      startCheckout({
        mode: 'buy-now',

        items: [
          {
            productId: product.id,
            size,
            color,
            quantity: 1
          }
        ]
      })
    );


    // Navigate to checkout
    this.router.navigate([
      '/checkout'
    ]);

  }


  toggleWishlist(product: Product): void {

    this.store.dispatch(
      toggleWishlist({
        product
      })
    );

  }

}