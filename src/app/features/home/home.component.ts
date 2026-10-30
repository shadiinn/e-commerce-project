import {
  Component,
  computed,
  ElementRef,
  inject,
  signal,
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
import { CATEGORIES } from '../../core/models/constants/categories';


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
  private host = inject<ElementRef<HTMLElement>>(ElementRef);


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
 categories = CATEGORIES;
 
  active = signal(0);
 
  previous = signal(0);       // the card that was active before
 
  moving = signal(false);     // true for 0.9s after each change (blur effect)
 
  paused = false;             // set by the template while the mouse is over it
 
  private timer = setInterval(() => {
 
    if (!this.paused) {
      this.step(1);
    }
 
  }, 4500);
 
 
  offset(
    i: number,
    current = this.active()
  ): number {
 
    const count = this.categories.length;
 
    return ((i - current + 1) % count + count) % count - 1;
 
  }
 
  // A card that wraps from one end to the other must jump, not
  // slide across the screen. Its offset changes by more than 2.
  jumped(
    i: number
  ): boolean {
 
    return Math.abs(
      this.offset(i) - this.offset(i, this.previous())
    ) > 2;
 
  }
 
  select(
    i: number
  ): void {
 
    if (i === this.active()) {
      return;
    }
 
    this.previous.set(this.active());
 
    this.active.set(i);
 
    this.moving.set(true);
 
    setTimeout(() => this.moving.set(false), 900);
 
  }
 
  step(
    direction: 1 | -1
  ): void {
 
    const count = this.categories.length;
 
    this.select(
      (this.active() + direction + count) % count
    );
 
  }
 
 
  // =========================================================
  // SCROLL REVEAL
  // =========================================================
  //
  // Every element in the template with class="reveal" fades up
  // once, the first time it scrolls into view. Adding .js-reveal
  // to the host switches on the hidden start state (see <style>).
  //
  // =========================================================
 
  private observer?: IntersectionObserver;
 
  ngAfterViewInit(): void {
 
    const root = this.host.nativeElement;
 
    root.classList.add('js-reveal');
 
    this.observer = new IntersectionObserver(
      entries => {
 
        for (const entry of entries) {
 
          if (entry.isIntersecting) {
 
            entry.target.classList.add('is-visible');
 
            this.observer?.unobserve(entry.target);
 
          }
 
        }
 
      },
      {
        threshold: 0.12
      }
    );
 
    root
      .querySelectorAll('.reveal')
      .forEach(el => this.observer?.observe(el));
 
  }
 
  ngOnDestroy(): void {
 
    clearInterval(this.timer);
 
    this.observer?.disconnect();
 
  }
 
}
 
