import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { Store } from '@ngrx/store';

import { AsyncPipe } from '@angular/common';

import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import {
  loadProducts
} from '../../store/products/products.actions';

import {
  selectAllProducts,
  selectProductsLoading,
  selectProductsError
} from '../../store/products/products.selectors';

import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import {
  PaginationComponent,
  paginate
} from '../../shared/components/pagination/pagination.component';

import { CATEGORIES } from '../../core/models/constants/categories';

import {
  ActivatedRoute,
  Router,
  Scroll
} from '@angular/router';


@Component({
  selector: 'app-shop',

  standalone: true,

  imports: [
    ProductCardComponent,
    PaginationComponent,
    AsyncPipe
  ],

  templateUrl: './shop.component.html',

  styleUrl: './shop.component.css'
})
export class ShopComponent implements OnInit {

  store = inject(Store);

  route = inject(ActivatedRoute);

  router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // true after a search from the navbar, until the page has scrolled to the products
  private scrollToProductsAfterNavigation = false;

  categories = CATEGORIES;


  // =========================================================
  // PRODUCTS
  // =========================================================

  products = toSignal(
    this.store.select(selectAllProducts),
    {
      initialValue: []
    }
  );

  loading$ =
    this.store.select(
      selectProductsLoading
    );

  error$ =
    this.store.select(
      selectProductsError
    );


  // =========================================================
  // APPLIED FILTER STATE
  // =========================================================

  selectedCategories =
    signal<string[]>([]);

  selectedSizes =
    signal<string[]>([]);

  minPrice =
    signal(0);

  maxPrice =
    signal(10000);

  inStockOnly =
    signal(false);

  searchTerm =
    signal('');


  // =========================================================
  // TEMPORARY FILTER STATE
  // =========================================================

  tempCategories =
    signal<string[]>([]);

  tempSizes =
    signal<string[]>([]);

  tempMinPrice =
    signal(0);

  tempMaxPrice =
    signal(10000);

  tempInStockOnly =
    signal(false);


  // =========================================================
  // SORT
  // =========================================================

  sortBy =
    signal('featured');


  // =========================================================
  // FILTER DRAWER
  // =========================================================

  isFilterOpen =
    signal(false);

  activeFilter =
    signal<string | null>(null);


  toggleFilter(
    section: string
  ): void {

    this.activeFilter.update(
      current =>
        current === section
          ? null
          : section
    );

  }


  // =========================================================
  // FILTER OPTIONS
  // =========================================================

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


  // =========================================================
  // PRODUCT HELPERS
  // =========================================================

  /**
   * Checks whether a product has at least one
   * selected size available in any of its variants.
   */
  productHasSelectedSize(
    product: any,
    selectedSizes: string[]
  ): boolean {

    if (
      selectedSizes.length === 0
    ) {

      return true;

    }


    return product.variants?.some(
      (variant: any) =>
        variant.sizes?.some(
          (size: any) =>
            selectedSizes.includes(
              size.size
            )
        )
    ) ?? false;

  }


  /**
   * Calculates total stock across all variants
   * and all sizes of a product.
   */
  getProductTotalStock(
    product: any
  ): number {

    return (
      product.variants?.reduce(
        (
          total: number,
          variant: any
        ) => {

          return (
            total +
            (
              variant.sizes?.reduce(
                (
                  variantTotal: number,
                  size: any
                ) =>
                  variantTotal +
                  (size.stock ?? 0),
                0
              ) ?? 0
            )
          );

        },
        0
      ) ?? 0
    );

  }


  // =========================================================
  // SEARCH HELPER
  // =========================================================

  /**
   * Checks whether a product matches the search term.
   *
   * Search looks through:
   *
   * - Product name
   * - Product category
   * - Product description
   * - Product slug
   * - Variant/color names
   */
  productMatchesSearch(
    product: any,
    search: string
  ): boolean {

    // -------------------------------------------------------
    // Normalize search
    // -------------------------------------------------------

    const normalizedSearch =
      search
        .trim()
        .toLowerCase();


    // -------------------------------------------------------
    // Empty search
    // -------------------------------------------------------

    if (!normalizedSearch) {

      return true;

    }


    // -------------------------------------------------------
    // Product fields
    // -------------------------------------------------------

    const name =
      String(
        product.name ?? ''
      )
        .toLowerCase();

    const category =
      String(
        product.category ?? ''
      )
        .toLowerCase();

    const description =
      String(
        product.description ?? ''
      )
        .toLowerCase();

    const slug =
      String(
        product.slug ?? ''
      )
        .toLowerCase();


    // -------------------------------------------------------
    // Variant colors
    // -------------------------------------------------------

    const variantMatches =
      product.variants?.some(
        (variant: any) => {

          const color =
            String(
              variant.color ?? ''
            )
              .toLowerCase();

          return color.includes(
            normalizedSearch
          );

        }
      ) ?? false;


    // -------------------------------------------------------
    // Final search match
    // -------------------------------------------------------

    return (
      name.includes(
        normalizedSearch
      ) ||

      category.includes(
        normalizedSearch
      ) ||

      description.includes(
        normalizedSearch
      ) ||

      slug.includes(
        normalizedSearch
      ) ||

      variantMatches
    );

  }


  // =========================================================
  // FILTERED PRODUCTS
  // =========================================================

  filteredProducts =
    computed(() => {

      const products =
        this.products();


      const categories =
        this.selectedCategories();


      const sizes =
        this.selectedSizes();


      const min =
        this.minPrice();


      const max =
        this.maxPrice();


      const inStock =
        this.inStockOnly();


      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();


      return products.filter(
        product => {


          // =================================================
          // SEARCH
          // =================================================

          const searchMatch =
            this.productMatchesSearch(
              product,
              search
            );


          // =================================================
          // CATEGORY
          // =================================================

          const categoryMatch =
            categories.length === 0 ||
            categories.includes(
              product.category
            );


          // =================================================
          // SIZE
          // =================================================

          const sizeMatch =
            this.productHasSelectedSize(
              product,
              sizes
            );


          // =================================================
          // PRICE
          // =================================================

          const priceMatch =
            product.price >= min &&
            product.price <= max;


          // =================================================
          // AVAILABILITY
          // =================================================

          const availabilityMatch =
            !inStock ||
            this.getProductTotalStock(
              product
            ) > 0;


          // =================================================
          // FINAL RESULT
          // =================================================

          return (
            searchMatch &&
            categoryMatch &&
            sizeMatch &&
            priceMatch &&
            availabilityMatch
          );

        }
      );

    });


  // =========================================================
  // SORTED PRODUCTS
  // =========================================================

  sortedProducts =
    computed(() => {

      const products = [
        ...this.filteredProducts()
      ];


      const sort =
        this.sortBy();


      switch (sort) {

        case 'price-low':

          return products.sort(
            (a, b) =>
              a.price - b.price
          );


        case 'price-high':

          return products.sort(
            (a, b) =>
              b.price - a.price
          );


        case 'newest':

          return products.sort(
            (a, b) =>
              Number(b.isNew) -
              Number(a.isNew)
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


  // =========================================================
  // SCROLL TO THE PRODUCTS
  // =========================================================

  // Brings the top of the product list into view.
  // The target is the empty <div id="shop-products"> in the template.
  private scrollToProducts(smooth = true): void {
    document
      .getElementById('shop-products')
      ?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'start'
      });
  }

  // =========================================================
  // PAGINATION  (the buttons come from <app-pagination>)
  // =========================================================

  // How many products are shown on one page.
  // 12 fills complete rows on every screen (2, 3 or 4 columns).
  readonly pageSize = 12;

  // The page the user asked for
  currentPage =
    signal(1);

  // One page of the sorted products:
  // { items, page, totalPages, totalItems }
  productPage =
    computed(() =>
      paginate(
        this.sortedProducts(),
        this.currentPage(),
        this.pageSize
      )
    );

  // Called when the user clicks a page button in <app-pagination>
  goToPage(
    page: number
  ): void {
    this.currentPage.set(page);
  }

  // Changing the sort order starts again from page 1
  changeSort(
    value: string
  ): void {
    this.sortBy.set(value);
    this.currentPage.set(1);
  }

  // =========================================================
  // HEADER CATEGORY
  // =========================================================

  selectAllCategories(): void {

    this.scrollToProducts();

    this.currentPage.set(1);

    this.selectedCategories.set([]);

  }


  selectHeaderCategory(
    category: string
  ): void {

    this.scrollToProducts();

    this.currentPage.set(1);

    this.selectedCategories.set([
      category
    ]);

  }


  // =========================================================
  // FILTER DRAWER
  // =========================================================

  openFilters(): void {

    // Copy applied filters
    // into temporary filters

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


    this.activeFilter.set(null);

    this.isFilterOpen.set(true);

  }


  closeFilters(): void {

    this.isFilterOpen.set(false);

    this.activeFilter.set(null);

  }


  // =========================================================
  // TEMP CATEGORY
  // =========================================================

  toggleCategory(
    category: string
  ): void {

    this.tempCategories.update(
      categories => {

        if (
          categories.includes(category)
        ) {

          return categories.filter(
            item =>
              item !== category
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

  toggleSize(
    size: string
  ): void {

    this.tempSizes.update(
      sizes => {

        if (
          sizes.includes(size)
        ) {

          return sizes.filter(
            item =>
              item !== size
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

    this.currentPage.set(1);

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

    this.activeFilter.set(null);

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

    this.currentPage.set(1);

    this.selectedCategories.set([]);

    this.selectedSizes.set([]);

    this.minPrice.set(0);

    this.maxPrice.set(10000);

    this.inStockOnly.set(false);

    this.searchTerm.set('');

    this.sortBy.set('featured');

    this.tempCategories.set([]);

    this.tempSizes.set([]);

    this.tempMinPrice.set(0);

    this.tempMaxPrice.set(10000);

    this.tempInStockOnly.set(false);


    // Clear the search and category
    // query parameters too.

    this.router.navigate(
      ['/shop']
    );

  }


  // =========================================================
  // RELOAD PRODUCTS
  // =========================================================

  reloadProducts(): void {

    this.store.dispatch(
      loadProducts()
    );

  }


  private isBrowserRefresh(): boolean {

    const navigation =
      performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

    return navigation?.type === 'reload';

  }


  // =========================================================
  // INIT
  // =========================================================

  private initialNavigationHandled = false;

  ngOnInit(): void {

    // A search from the navbar is a router navigation, and after EVERY navigation the
    // router scrolls to the very top. The router tells us about it (Scroll event)
    // slightly BEFORE it scrolls, so we wait one tick (setTimeout) and scroll to the
    // products afterwards. Otherwise the router would undo our scroll.
    this.router.events
      .pipe(
        filter((event): event is Scroll => event instanceof Scroll),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.scrollToProductsAfterNavigation) {
          this.scrollToProductsAfterNavigation = false;
          setTimeout(() => this.scrollToProducts(false));
        }
      });

    this.reloadProducts();

    this.route.queryParamMap.subscribe(
      params => {

        this.currentPage.set(1);

        const search =
          params.get('search') ?? '';

        const category =
          params.get('category') ?? '';


        // -----------------------------------------------------
        // Handle browser refresh
        // -----------------------------------------------------
        //
        // If the browser is refreshed while a search query
        // exists, clear the search and return to /shop.
        //
        // Category navigation should still work normally.
        // -----------------------------------------------------

        if (
          !this.initialNavigationHandled &&
          this.isBrowserRefresh() &&
          search
        ) {

          this.initialNavigationHandled = true;

          this.searchTerm.set('');

          this.selectedCategories.set(
            category
              ? [category]
              : []
          );

          this.router.navigate(
            ['/shop'],
            {
              replaceUrl: true
            }
          );

          return;

        }


        // -----------------------------------------------------
        // Apply search query
        // -----------------------------------------------------

        this.searchTerm.set(
          search
        );

        // A search was made -> scroll to the products after the navigation is done
        if (search) {
          this.scrollToProductsAfterNavigation = true;
        }


        // -----------------------------------------------------
        // Apply category query
        // -----------------------------------------------------

        if (category) {

          this.selectedCategories.set([
            category
          ]);

        } else {

          this.selectedCategories.set([]);

        }


        this.initialNavigationHandled = true;

      }
    );

  }

}