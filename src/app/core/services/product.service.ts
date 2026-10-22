import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { Product } from '../models/product.model';

// Some pieces of one size of one colour of one product (an order line)
export interface StockChange {
  productId: string;
  variantId: string;
  size: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor() { }
  http=inject(HttpClient);
  API_URL='http://localhost:3000/products';
  
  getProducts(){
    return this.http.get<Product[]>(this.API_URL);
  }

  adjustStock(items: StockChange[], direction: 1 | -1): Observable<unknown> {
    return this.getProducts().pipe(
      switchMap((products): Observable<unknown> => {
        const requests: Observable<unknown>[] = [];
        const productIds = [...new Set(items.map(item => item.productId))];

        for (const productId of productIds) {
          const product = products.find(item => item.id === productId);
          if (!product) continue;

          const variants = product.variants.map(variant => ({
            ...variant,
            sizes: variant.sizes.map(size => {
              // how many pieces of THIS size are in the order
              const pieces = items
                .filter(item => item.productId === productId && item.variantId === variant.id && item.size === size.size)
                .reduce((sum, item) => sum + item.quantity, 0);

              // the stock never goes below 0
              return { ...size, stock: Math.max(0, size.stock + direction * pieces) };
            })
          }));

          requests.push(this.http.patch<Product>(`${this.API_URL}/${productId}`, { variants }));
        }

        // forkJoin of an empty list would finish without a value
        return requests.length > 0 ? forkJoin(requests) : of(null);
      })
    );
  }

  // Adds a new product (admin only)
  createProduct(product: Product) {
    return this.http.post<Product>(this.API_URL, product);
  }

  // Replaces a whole product (admin only). PUT, not PATCH, so a removed field (for
  // example the old price) is really removed.
  replaceProduct(product: Product) {
    return this.http.put<Product>(`${this.API_URL}/${product.id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}