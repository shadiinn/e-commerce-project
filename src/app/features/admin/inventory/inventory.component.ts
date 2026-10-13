import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';
import { selectAllProducts } from '../../../store/products/products.selectors';
import { AdminDataService } from '../admin.service';
import { paginate, PaginationComponent } from '../../../shared/components/pagination/pagination.component';

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
  stock: string;
}

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [RouterLink,PaginationComponent],
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


  readonly pageSize = 10;
  currentPage = signal(1);

  inventoryPage = computed(() =>
    paginate(this.rows(), this.currentPage(), this.pageSize)
  );

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  setSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
  }


  search = signal('');
  stockProduct = signal<Product | null>(null);
  stockRows = signal<StockRow[]>([]);
  saving = signal(false);

  // Display products with low stock, sorted from lowest to highest.
  rows = computed<InventoryRow[]>(() => {
    const term = this.search().trim().toLowerCase();

    return this.products()
      .flatMap(product =>
        product.variants.flatMap(variant =>
          variant.sizes
            .filter(size => size.stock <= LOW_STOCK_LIMIT)
            .map(size => ({
              productId: product.id,
              productName: product.name,
              category: product.category,
              color: variant.color,
              size: size.size,
              stock: size.stock
            }))
        )
      )
      .filter(row =>
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

  lowStockProducts = computed(
    () => new Set(this.rows().map(row => row.productId)).size
  );

  outOfStock = computed(
    () => this.rows().filter(row => row.stock === 0).length
  );

  // Only non-negative whole numbers are valid.
  isValidStock(value: string): boolean {
    return /^\d+$/.test(value);
  }

  // Empty inputs are invalid for saving, but don't show an error message.
  hasInvalidStock = computed(() =>
    this.stockRows().some(row => !this.isValidStock(row.stock))
  );

  openStock(productId: string): void {
    const product = this.products().find(item => item.id === productId);

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
          stock: String(size.stock)
        }))
      )
    );

    this.stockProduct.set(product);
  }

  setRowStock(index: number, value: string): void {
    this.stockRows.update(rows =>
      rows.map((row, i) =>
        i === index ? { ...row, stock: value } : row
      )
    );
  }

  closeStock(): void {
    if (!this.saving()) {
      this.stockProduct.set(null);
    }
  }

  saveStock(): void {
    const product = this.stockProduct();

    if (!product || this.saving() || this.hasInvalidStock()) {
      return;
    }

    const rows = this.stockRows();

    const updatedProduct: Product = {
      ...product,
      variants: product.variants.map(variant => ({
        ...variant,
        sizes: variant.sizes.map(size => ({
          ...size,
          stock: Number(
            rows.find(
              row =>
                row.variantId === variant.id &&
                row.size === size.size
            )?.stock ?? size.stock
          )
        }))
      }))
    };

    this.saving.set(true);

    this.data.saveProduct(updatedProduct, false).subscribe({
      next: () => {
        this.toast.success(`Stock of "${product.name}" updated.`);
        this.saving.set(false);
        this.stockProduct.set(null);
      },
      error: () => {
        this.toast.error('Could not update the stock. Please try again.');
        this.saving.set(false);
      }
    });
  }

  money(value: number): string {
    return this.data.money(value);
  }
}