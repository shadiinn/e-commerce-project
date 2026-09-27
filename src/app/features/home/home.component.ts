import {
  Component,
  computed,
  inject
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  Store
} from '@ngrx/store';

import {
  toSignal
} from '@angular/core/rxjs-interop';

import {
  selectAllProducts
} from '../../store/products/products.selectors';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  private store = inject(Store);


  // =========================================================
  // PRODUCTS
  // =========================================================

  products = toSignal(
    this.store.select(selectAllProducts),
    {
      initialValue: []
    }
  );


  // =========================================================
  // NEW ARRIVALS
  // =========================================================
  //
  // We use products marked with isNew === true.
  //
  // Only the first 4 products are displayed on the Home page.
  //
  // The image is taken from:
  //
  // product
  //   -> first variant
  //      -> first image
  //
  // =========================================================

  newArrivals = computed(() => {

    return this.products()
      .filter(product => product.isNew)
      .slice(0, 4)
      .map(product => ({

        id: product.id,

        name: product.name,

        price: product.price,

        image:
          product.variants?.[0]?.images?.[0] ?? ''

      }));

  });

}