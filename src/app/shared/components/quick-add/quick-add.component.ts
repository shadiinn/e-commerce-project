import {
  Component,
  input,
  output,
  signal,
  inject
} from '@angular/core';

import { Store } from '@ngrx/store';

import { Product } from '../../../core/models/product.model';

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

  selectedSize =
    signal<string | null>(null);


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

  addProductToCart(): void {

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

              product:
                this.product(),

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

              size

            })
          );

        }


        // -------------------------------------------------
        // CLOSE QUICK ADD
        // -------------------------------------------------

        this.close.emit();

      });

  }


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  closeModal(): void {

    this.close.emit();

  }

}