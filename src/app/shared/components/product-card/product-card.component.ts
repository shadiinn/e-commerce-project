import {
  Component,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';

import { Product } from '../../../core/models/product.model';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  selectIsProductInWishlist
} from '../../../store/wishlist/wishlist.selectors';
import {
  toggleWishlist
} from '../../../store/wishlist/wishlist.actions';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { QuickAddComponent } from '../quick-add/quick-add.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectNewProductIds } from '../../../store/products/products.selectors';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    RouterLink,
    AsyncPipe,
    QuickAddComponent
  ],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent implements OnInit {

  private store = inject(Store);

  product = input.required<Product>();

  isWishlisted$!: Observable<boolean>;

  isQuickAddOpen =signal(false);

  private newProductIds = toSignal(
    this.store.select(selectNewProductIds),
    { initialValue: new Set<string>() }
  );
  ngOnInit(): void {
    this.isWishlisted$ =
      this.store.select(
        selectIsProductInWishlist(
          this.product().id
        )
      );
  }
  
  get totalStock(): number {
    return this.product().variants.reduce(
      (variantTotal, variant) =>
        variantTotal +
        variant.sizes.reduce(
          (sizeTotal, size) => sizeTotal + size.stock,
          0
        ),
      0
    );
  }
  get isNewArrival(): boolean {
    return this.newProductIds().has(this.product().id);
  }
  toggleWishlist(): void {
    this.store.dispatch(
      toggleWishlist({
        product: this.product()
      })
    );
  }

  openQuickAdd(): void {
    this.isQuickAddOpen.set(true);
  }

  closeQuickAdd(): void {
    this.isQuickAddOpen.set(false);
  }

}