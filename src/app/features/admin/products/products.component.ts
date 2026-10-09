import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { CATEGORIES } from '../../../core/models/constants/categories';
import { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent, paginate } from '../../../shared/components/pagination/pagination.component';
import { selectAllProducts, selectProductsLoading } from '../../../store/products/products.selectors';
import { AdminDataService } from '../admin.service';

// A size with this much stock (or less) is shown as "low"
const LOW_STOCK_LIMIT = 5;

type SortKey = 'latest' | 'name' | 'price-low' | 'price-high' | 'stock-low';

// One line of the stock popup: one size of one colour
interface StockRow {
  variantId: string;
  color: string;
  size: string;
  stock: number;
}

/*
  The Products page:
    1. the list: search, sorting (latest added first), pagination, edit buttons
    2. a popup to change the stock of one product quickly

  The products come from the products slice of the store (the same list the shop uses).
  Adding and editing a whole product is on its own page (admin-product-form).
*/
@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [RouterLink, PaginationComponent],
  templateUrl: './products.component.html'
})
export class AdminProductsComponent {

  private store = inject(Store);
  private toast = inject(ToastService);
  data = inject(AdminDataService);

  private products = toSignal(this.store.select(selectAllProducts), { initialValue: [] });
  loading = toSignal(this.store.select(selectProductsLoading), { initialValue: false });

  readonly pageSize = 10;

  search = signal('');
  sortBy = signal<SortKey>('latest');
  currentPage = signal(1);

  readonly sortOptions: { value: SortKey; label: string }[] = [
    { value: 'latest', label: 'Latest added' },
    { value: 'name', label: 'Name (A to Z)' },
    { value: 'price-low', label: 'Price (low to high)' },
    { value: 'price-high', label: 'Price (high to low)' },
    { value: 'stock-low', label: 'Stock (low to high)' }
  ];


  // ===================================================================
  // 1. THE LIST
  // ===================================================================

  // The products that match the search, in the chosen order
  private visibleProducts = computed(() => {
    const term = this.search().trim().toLowerCase();

    // Remember where each product is in the list. New products are added at the END
    // of the list, so a bigger position means "added later".
    const rows = this.products().map((product, position) => ({ product, position }));

    const matching = rows.filter(row => !term || this.matchesSearch(row.product, term));

    switch (this.sortBy()) {

      case 'name':
        matching.sort((a, b) => a.product.name.localeCompare(b.product.name));
        break;

      case 'price-low':
        matching.sort((a, b) => a.product.price - b.product.price);
        break;

      case 'price-high':
        matching.sort((a, b) => b.product.price - a.product.price);
        break;

      case 'stock-low':
        matching.sort((a, b) => this.totalStock(a.product) - this.totalStock(b.product));
        break;

      default:
        // LATEST ADDED FIRST: newer date first. Products without a date (the old ones)
        // are ordered by their position in the list, the last one first.
        matching.sort((a, b) =>
          (b.product.createdAt ?? '').localeCompare(a.product.createdAt ?? '') ||
          b.position - a.position
        );
    }

    return matching.map(row => row.product);
  });

  // Only the products of the current page
  productPage = computed(() =>
    paginate(this.visibleProducts(), this.currentPage(), this.pageSize)
  );

  // The search looks at the name, category, slug and the colours
  private matchesSearch(product: Product, term: string): boolean {
    return [
      product.name,
      product.category,
      product.slug,
      ...product.variants.map(variant => variant.color)
    ].some(text => text.toLowerCase().includes(term));
  }

  // a new search or sorting starts again from page 1
  setSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
  }

  setSort(value: string): void {
    this.sortBy.set(value as SortKey);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  // number of pieces in stock, all colours and sizes together
  totalStock(product: Product): number {
    return product.variants.reduce(
      (sum, variant) => sum + variant.sizes.reduce((inner, size) => inner + size.stock, 0),
      0
    );
  }

  // true when at least one size is almost sold out (and something is still left)
  hasLowSize(product: Product): boolean {
    return product.variants.some(variant =>
      variant.sizes.some(size => size.stock <= LOW_STOCK_LIMIT)
    );
  }

  categoryName(slug: string): string {
    return CATEGORIES.find(category => category.slug === slug)?.name ?? slug;
  }

  firstImage(product: Product): string {
    return product.variants[0]?.images[0] ?? '';
  }


  // ===================================================================
  // 2. THE STOCK POPUP
  // ===================================================================

  stockProduct = signal<Product | null>(null);   // the product in the popup (null = closed)
  stockRows = signal<StockRow[]>([]);
  saving = signal(false);

  openStock(product: Product): void {
    // one row for every size of every colour
    this.stockRows.set(
      product.variants.flatMap(variant =>
        variant.sizes.map(size => ({
          variantId: variant.id,
          color: variant.color,
          size: size.size,
          stock: size.stock
        }))
      )
    );
    this.stockProduct.set(product);
  }

  closeStock(): void {
    this.stockProduct.set(null);
  }

  // A number was typed in one row. Whole numbers from 0 up only.
  setRowStock(index: number, value: number): void {
    const stock = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

    this.stockRows.update(rows =>
      rows.map((row, i) => (i === index ? { ...row, stock } : row))
    );
  }

  saveStock(): void {
    const product = this.stockProduct();
    if (!product || this.saving()) return;

    const rows = this.stockRows();

    // the same product, with the new stock numbers
    const changed: Product = {
      ...product,
      variants: product.variants.map(variant => ({
        ...variant,
        sizes: variant.sizes.map(size => ({
          ...size,
          stock: rows.find(row => row.variantId === variant.id && row.size === size.size)?.stock ?? size.stock
        }))
      }))
    };

    this.saving.set(true);

    this.data.saveProduct(changed, false).subscribe({
      next: () => {
        this.toast.success(`Stock of "${product.name}" updated.`);
        this.saving.set(false);
        this.closeStock();
      },
      error: () => {
        this.toast.error('Could not update the stock. Please try again.');
        this.saving.set(false);
      }
    });
  }
}