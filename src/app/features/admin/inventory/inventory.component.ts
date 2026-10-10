import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent, paginate } from '../../../shared/components/pagination/pagination.component';
import { selectAllProducts } from '../../../store/products/products.selectors';
import { AdminDataService } from '../admin.service';

const LOW_STOCK_LIMIT = 5;

interface InventoryRow {
  productId: string;
  productName: string;
  category: string;
  color: string;
  size: string;
  stock: number;
}

interface StockRow {
  variantId: string;
  color: string;
  size: string;
  stock: number;
}

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [RouterLink, PaginationComponent],
  templateUrl: './inventory.component.html'
})
export class AdminInventoryComponent {
  private store = inject(Store);
  private toast = inject(ToastService);

  data = inject(AdminDataService);

  private products = toSignal(
    this.store.select(selectAllProducts),
    { initialValue: [] as Product[] }
  );

  // Pagination
  readonly pageSize = 10;
  currentPage = signal(1);

  // Search
  search = signal('');

  // =====================================================
  // INVENTORY ROWS
  // =====================================================

  rows = computed<InventoryRow[]>(() => {
    const term = this.search().trim().toLowerCase();
    const rows: InventoryRow[] = [];

    for (const product of this.products()) {
      for (const variant of product.variants) {
        for (const size of variant.sizes) {
          if (size.stock <= LOW_STOCK_LIMIT) {
            rows.push({
              productId: product.id,
              productName: product.name,
              category: product.category,
              color: variant.color,
              size: size.size,
              stock: size.stock
            });
          }
        }
      }
    }

    // Filter by product, category, colour or size.
    // Then sort by ascending stock, with out-of-stock first.
    return rows
      .filter(row =>
        !term ||
        `${row.productName} ${row.category} ${row.color} ${row.size}`
          .toLowerCase()
          .includes(term)
      )
      .sort((a, b) =>
        a.stock - b.stock ||
        a.productName.localeCompare(b.productName) ||
        a.color.localeCompare(b.color) ||
        a.size.localeCompare(b.size)
      );
  });

  // Paginated inventory rows
  rowPage = computed(() =>
    paginate(
      this.rows(),
      this.currentPage(),
      this.pageSize
    )
  );

  // Reset pagination whenever the search changes.
  setSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
  }

  // Handle pagination changes.
  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  // =====================================================
  // INVENTORY SUMMARY
  // =====================================================

  lowStockProducts = computed(() =>
    new Set(this.rows().map(row => row.productId)).size
  );

  outOfStock = computed(() =>
    this.rows().filter(row => row.stock === 0).length
  );

  // =====================================================
  // STOCK-ONLY EDITOR
  // =====================================================

  stockProduct = signal<Product | null>(null);
  stockRows = signal<StockRow[]>([]);
  saving = signal(false);

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
    if (!this.saving()) {
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

    if (!product || this.saving()) {
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

    this.saving.set(true);

    this.data.saveProduct(updatedProduct, false).subscribe({
      next: () => {
        this.toast.success(
          `Stock of "${product.name}" updated.`
        );

        this.saving.set(false);
        this.stockProduct.set(null);
      },

      error: () => {
        this.toast.error(
          'Could not update the stock. Please try again.'
        );

        this.saving.set(false);
      }
    });
  }

  // =====================================================
  // HELPERS
  // =====================================================

  money(value: number): string {
    return this.data.money(value);
  }
}