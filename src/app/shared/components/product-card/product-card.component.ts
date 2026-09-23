import { Component,inject,input, OnInit,signal } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsProductInWishlist } from '../../../store/wishlist/wishlist.selectors';
import { toggleWishlist } from '../../../store/wishlist/wishlist.actions';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { QuickAddComponent } from '../quick-add/quick-add.component';


@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink,AsyncPipe,QuickAddComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent implements OnInit {

  private store = inject(Store);

  product = input.required<Product>();

  isWishlisted$!: Observable<boolean>;

  // QUICK ADD STATE
  // =====================================================

  isQuickAddOpen = signal(false);

  ngOnInit(): void {

    this.isWishlisted$ = this.store.select(
      selectIsProductInWishlist(this.product().id)
    );

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


  // =====================================================
  // CLOSE QUICK ADD
  // =====================================================

  closeQuickAdd(): void {

    this.isQuickAddOpen.set(false);

  }
}
