import {
  Component,
  computed,
  ElementRef,
  inject,
  ViewChild
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
  selectFeaturedProducts
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
  // FEATURED PRODUCTS
  // =========================================================
  //
  // What counts as "featured" and how many come back is
  // entirely decided in selectFeaturedProducts (products.selectors.ts)
  // — this component just displays whatever it returns.
  //
  // The image is taken from:
  //
  // product
  //   -> first variant
  //      -> first image
  //
  // =========================================================

  private featuredProductsRaw = toSignal(
    this.store.select(selectFeaturedProducts),
    {
      initialValue: []
    }
  );

  featuredProducts = computed(() => {

    return this.featuredProductsRaw()
      .map(product => ({

        id: product.id,

        name: product.name,

        price: product.price,

        image:
          product.variants?.[0]?.images?.[0] ?? ''

      }));

  });


  // =========================================================
  // SWIPE / SCROLL CONTROLS
  // =========================================================
  //
  // Touch/trackpad swiping works natively through the scroll
  // container's own CSS (overflow-x-auto + scroll-snap). These
  // arrow buttons are just a convenience for mouse users.
  //
  // =========================================================

  @ViewChild('featuredScroller')
  private featuredScroller?: ElementRef<HTMLDivElement>;

  scrollFeatured(
    direction: 1 | -1
  ): void {

    const el =
      this.featuredScroller?.nativeElement;

    if (!el) {
      return;
    }

    el.scrollBy({
      left: el.clientWidth * 0.85 * direction,
      behavior: 'smooth'
    });

  }

}