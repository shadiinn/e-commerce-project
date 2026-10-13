import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { CATEGORIES } from '../../../core/models/constants/categories';
import { Product } from '../../../core/models/product.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';
import {
  PaginationComponent,
  paginate
} from '../../../shared/components/pagination/pagination.component';
import {
  selectAllProducts,
  selectProductsLoading,
  selectNewProductIds
} from '../../../store/products/products.selectors';
import { AdminDataService } from '../admin.service';

type SortKey =
  | 'latest'
  | 'name'
  | 'price-low'
  | 'price-high'
  | 'stock-low';

interface StockRow {
  variantId: string;
  color: string;
  size: string;
  stock: number;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    RouterLink,
    PaginationComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './products.component.html'
})
export class AdminProductsComponent {

  private store = inject(Store);
  private toast = inject(ToastService);

  data = inject(AdminDataService);

  private products = toSignal(
    this.store.select(selectAllProducts),
    { initialValue: [] }
  );

  loading = toSignal(
    this.store.select(selectProductsLoading),
    { initialValue: false }
  );

  // Derived by the NgRx selector: products created within the last 30 days.
  newProductIds = toSignal(
    this.store.select(selectNewProductIds),
    { initialValue: new Set<string>() }
  );

  readonly pageSize = 10;

  search = signal('');
  sortBy = signal<SortKey>('latest');
  currentPage = signal(1);

  readonly sortOptions: {
    value: SortKey;
    label: string;
  }[] = [
    { value: 'latest', label: 'Latest added' },
    { value: 'name', label: 'Name (A to Z)' },
    { value: 'price-low', label: 'Price (low to high)' },
    { value: 'price-high', label: 'Price (high to low)' },
    { value: 'stock-low', label: 'Stock (low to high)' }
  ];

  // =====================================================
  // PRODUCT LIST
  // =====================================================

  private visibleProducts = computed(() => {
    const term = this.search().trim().toLowerCase();

    const rows = this.products().map(
      (product, position) => ({ product, position })
    );

    const matching = rows.filter(
      row => !term || this.matchesSearch(row.product, term)
    );

    switch (this.sortBy()) {

      case 'name':
        matching.sort((a, b) =>
          a.product.name.localeCompare(b.product.name)
        );
        break;

      case 'price-low':
        matching.sort(
          (a, b) => a.product.price - b.product.price
        );
        break;

      case 'price-high':
        matching.sort(
          (a, b) => b.product.price - a.product.price
        );
        break;

      case 'stock-low':
        matching.sort(
          (a, b) => this.totalStock(a.product) - this.totalStock(b.product)
        );
        break;

      default:
        matching.sort((a, b) =>
          (b.product.createdAt ?? '').localeCompare(
            a.product.createdAt ?? ''
          ) || b.position - a.position
        );
    }

    return matching.map(row => row.product);
  });

  productPage = computed(() =>
    paginate(
      this.visibleProducts(),
      this.currentPage(),
      this.pageSize
    )
  );

  private matchesSearch(
    product: Product,
    term: string
  ): boolean {
    return [
      product.name,
      product.category,
      product.slug,
      ...product.variants.map(variant => variant.color)
    ].some(text => text.toLowerCase().includes(term));
  }

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

  // =====================================================
  // PRODUCT HELPERS
  // =====================================================

  totalStock(product: Product): number {
    return product.variants.reduce(
      (sum, variant) =>
        sum + variant.sizes.reduce(
          (inner, size) => inner + size.stock,
          0
        ),
      0
    );
  }

  categoryName(slug: string): string {
    return CATEGORIES.find(
      category => category.slug === slug
    )?.name ?? slug;
  }

  firstImage(product: Product): string {
    return product.variants[0]?.images[0] ?? '';
  }

  isNew(product: Product): boolean {
    return this.newProductIds().has(product.id);
  }
  
  productTag(product: Product): 'COMING SOON' | 'NEW' | 'OUT OF STOCK' | null {
    const isNew = this.isNew(product);
    const outOfStock = this.totalStock(product) === 0;

    if (outOfStock && isNew) {
      return 'COMING SOON';
    }

    if (isNew) {
      return 'NEW';
    }

    if (outOfStock) {
      return 'OUT OF STOCK';
    }

    return null;
  }
  // =====================================================
  // VIEW PRODUCT
  // =====================================================

  selectedProduct = signal<Product | null>(null);

  openProduct(product: Product): void {
    this.selectedProduct.set(product);
  }

  // =====================================================
  // UPDATE STOCK
  // =====================================================

  stockProduct = signal<Product | null>(null);

  stockRows = signal<StockRow[]>([]);

  savingStock = signal(false);

  openStock(productId: string): void {
    const product = this.products().find(
      item => item.id === productId
    );

    if (!product) {
      this.toast.error(
        'Could not find this product. Please refresh the page and try again.'
      );
      return;
    }

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
    if (!this.savingStock()) {
      this.stockProduct.set(null);
    }
  }

  setRowStock(index: number, value: number): void {
    const stock = Number.isFinite(value)
      ? Math.max(0, Math.floor(value))
      : 0;

    this.stockRows.update(rows =>
      rows.map((row, i) =>
        i === index
          ? { ...row, stock }
          : row
      )
    );
  }

  saveStock(): void {
    const product = this.stockProduct();

    if (!product || this.savingStock()) {
      return;
    }

    const rows = this.stockRows();

    const updatedProduct: Product = {
      ...product,

      variants: product.variants.map(variant => ({
        ...variant,

        sizes: variant.sizes.map(size => ({
          ...size,

          stock:
            rows.find(
              row =>
                row.variantId === variant.id &&
                row.size === size.size
            )?.stock ?? size.stock
        }))
      }))
    };

    this.savingStock.set(true);

    this.data.saveProduct(updatedProduct, false).subscribe({
      next: () => {
        this.toast.success(
          `Stock of "${product.name}" updated.`
        );

        this.savingStock.set(false);
        this.stockProduct.set(null);
      },

      error: () => {
        this.toast.error(
          'Could not update the stock. Please try again.'
        );

        this.savingStock.set(false);
      }
    });
  }

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  productToDelete = signal<Product | null>(null);

  deleting = signal(false);

  requestDelete(product: Product): void {
    this.productToDelete.set(product);
  }

  cancelDelete(): void {
    this.productToDelete.set(null);
  }

  confirmDelete(): void {
    const product = this.productToDelete();

    if (!product || this.deleting()) {
      return;
    }

    this.deleting.set(true);

    this.data.deleteProduct(product.id).subscribe({
      next: () => {
        this.toast.success(
          `"${product.name}" was deleted from the catalogue.`
        );

        this.deleting.set(false);
        this.productToDelete.set(null);

        if (this.selectedProduct()?.id === product.id) {
          this.selectedProduct.set(null);
        }
      },

      error: () => {
        this.toast.error(
          'Could not delete this product. Please try again.'
        );

        this.deleting.set(false);
      }
    });
  }
}