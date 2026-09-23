import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  loadProducts
} from '../../store/products/products.actions';
import {
  selectAllProducts,
  selectProductsLoading,
  selectProductsError
} from '../../store/products/products.selectors';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CATEGORIES } from '../../core/models/constants/categories';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    ProductCardComponent,
    AsyncPipe
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent implements OnInit {

  store = inject(Store);
  route = inject(ActivatedRoute);
  router = inject(Router);
  categories = CATEGORIES;

  // PRODUCTS

  products = toSignal(
    this.store.select(selectAllProducts),
    {
      initialValue: []
    }
  );

  loading$ = this.store.select(selectProductsLoading);
  error$ = this.store.select(selectProductsError);

  // APPLIED FILTER STATE


  selectedCategories = signal<string[]>([]);
  selectedSizes = signal<string[]>([]);
  minPrice = signal(0);
  maxPrice = signal(10000);
  inStockOnly = signal(false);
  searchTerm = signal('');


  // TEMPORARY FILTER STATE

  tempCategories = signal<string[]>([]);
  tempSizes = signal<string[]>([]);
  tempMinPrice = signal(0);
  tempMaxPrice = signal(10000);
  tempInStockOnly = signal(false);


  // SORT

  sortBy = signal('featured');

  // FILTER DRAWER

  isFilterOpen = signal(false);
  activeFilter = signal<string | null>(null);

  toggleFilter(section: string): void {
    this.activeFilter.update(
      current => current === section ? null : section
    );
  }

  // FILTER OPTIONS

  availableSizes = [
    'S',
    'M',
    'L',
    'XL',
    '30',
    '32',
    '34',
    '36',
    '38'
  ];

  // FILTERED PRODUCTS

  filteredProducts = computed(() => {

    const products = this.products();

    const categories = this.selectedCategories();
    const sizes = this.selectedSizes();

    const min = this.minPrice();
    const max = this.maxPrice();

    const inStock = this.inStockOnly();

    const search = this.searchTerm()
      .trim()
      .toLowerCase();

    return products.filter(product => {

      // SEARCH
      const searchMatch =
        search === '' ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      // CATEGORY
      const categoryMatch =
        categories.length === 0 ||
        categories.includes(product.category);

      // SIZE
      const sizeMatch =
        sizes.length === 0 ||
        product.sizes.some(size =>
          sizes.includes(size)
        );

      // PRICE
      const priceMatch =
        product.price >= min &&
        product.price <= max;

      // AVAILABILITY
      const availabilityMatch =
        !inStock ||
        product.stock > 0;

      return (
        searchMatch &&
        categoryMatch &&
        sizeMatch &&
        priceMatch &&
        availabilityMatch
      );

    });

  });

  // SORTED PRODUCTS

  sortedProducts = computed(() => {
    const products = [...this.filteredProducts()];
    const sort = this.sortBy();

    switch (sort) {

      case 'price-low':
        return products.sort(
          (a, b) => a.price - b.price
        );

      case 'price-high':
        return products.sort(
          (a, b) => b.price - a.price
        );

      case 'newest':
        return products.sort(
          (a, b) =>
            Number(b.isNew) - Number(a.isNew)
        );

      case 'featured':
      default:
        return products.sort(
          (a, b) =>
            Number(b.isFeatured) -
            Number(a.isFeatured)
        );
    }
  });


  // HEADER CATEGORY

  selectAllCategories(): void {

    this.selectedCategories.set([]);

  }
  selectHeaderCategory(category: string): void {

    this.selectedCategories.set([
      category
    ]);

  }


  // FILTER DRAWER

  openFilters(): void {

    // Copy applied filters into temporary filters
    this.tempCategories.set([
      ...this.selectedCategories()
    ]);

    this.tempSizes.set([
      ...this.selectedSizes()
    ]);

    this.tempMinPrice.set(
      this.minPrice()
    );

    this.tempMaxPrice.set(
      this.maxPrice()
    );

    this.tempInStockOnly.set(
      this.inStockOnly()
    );

    this.isFilterOpen.set(true);

  }


  closeFilters(): void {

    this.isFilterOpen.set(false);

  }


  // =========================================================
  // TEMP CATEGORY
  // =========================================================

  toggleCategory(category: string): void {

    this.tempCategories.update(
      categories => {

        if (categories.includes(category)) {

          return categories.filter(
            item => item !== category
          );

        }

        return [
          ...categories,
          category
        ];

      }
    );

  }


  // =========================================================
  // TEMP SIZE
  // =========================================================

  toggleSize(size: string): void {

    this.tempSizes.update(
      sizes => {

        if (sizes.includes(size)) {

          return sizes.filter(
            item => item !== size
          );

        }

        return [
          ...sizes,
          size
        ];

      }
    );

  }



  // =========================================================
  // APPLY FILTERS
  // =========================================================

  applyFilters(): void {

    this.selectedCategories.set([
      ...this.tempCategories()
    ]);

    this.selectedSizes.set([
      ...this.tempSizes()
    ]);

    this.minPrice.set(
      this.tempMinPrice()
    );

    this.maxPrice.set(
      this.tempMaxPrice()
    );

    this.inStockOnly.set(
      this.tempInStockOnly()
    );

    this.isFilterOpen.set(false);

  }


  // =========================================================
  // RESET FILTERS
  // =========================================================

  resetFilters(): void {

    this.tempCategories.set([]);

    this.tempSizes.set([]);

    this.tempMinPrice.set(0);

    this.tempMaxPrice.set(10000);

    this.tempInStockOnly.set(false);

  }


  // =========================================================
  // CLEAR ALL APPLIED FILTERS
  // =========================================================

  clearAllFilters(): void {

    this.selectedCategories.set([]);

    this.selectedSizes.set([]);

    this.minPrice.set(0);

    this.maxPrice.set(10000);

    this.inStockOnly.set(false);

    this.searchTerm.set('');

    this.sortBy.set('featured');

    this.router.navigate(['/shop']);

  }


  // =========================================================
  // RELOAD PRODUCTS
  // =========================================================

  reloadProducts(): void {

    this.store.dispatch(
      loadProducts()
    );

  }


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadProducts();

    this.route.queryParams.subscribe(params => {

    const search = params['search'] || '';

    this.searchTerm.set(search);

  });
  }


  loadProducts(): void {

    this.store.dispatch(
      loadProducts()
    );

  }

}