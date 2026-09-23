import {
  Component,
  input,
  output,
  signal,
  inject
} from '@angular/core';

import { Store } from '@ngrx/store';

import { Product } from '../../../core/models/product.model';

import { addToCart } from '../../../store/cart/cart.actions';

@Component({
  selector: 'app-quick-add',
  standalone: true,
  imports: [],
  templateUrl: './quick-add.component.html',
  styleUrl: './quick-add.component.css'
})
export class QuickAddComponent {

  private store = inject(Store);

  product = input.required<Product>();

  close = output<void>();


  // =====================================================
  // LOCAL UI STATE
  // =====================================================

  selectedSize = signal<string | null>(null);

  selectedColor = signal<string | null>(null);


  // =====================================================
  // SELECT SIZE
  // =====================================================

  selectSize(size: string): void {

    this.selectedSize.set(size);

  }


  // =====================================================
  // SELECT COLOR
  // =====================================================

  selectColor(color: string): void {

    this.selectedColor.set(color);

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  addProductToCart(): void {

    if (
      !this.product ||
      !this.selectedSize() ||
      !this.selectedColor()
    ) {
      return;
    }

    this.store.dispatch(
      addToCart({
        product: this.product(),
        size: this.selectedSize()!,
        color: this.selectedColor()!
      })
    );

    this.close.emit();

  }


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  closeModal(): void {

    this.close.emit();

  }

}