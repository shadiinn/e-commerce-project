import {
  HttpClient
} from '@angular/common/http';

import {
  inject,
  Injectable
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import {
  CartItem
} from '../models/cart.model';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  private http =
    inject(HttpClient);


  private readonly API_URL =
    'http://localhost:3000/cart';


  // =====================================================
  // GET CURRENT USER'S CART
  // =====================================================

  getCart(
    userId: string
  ): Observable<CartItem[]> {

    return this.http.get<CartItem[]>(
      `${this.API_URL}?userId=${userId}`
    );

  }


  // =====================================================
  // ADD CART ITEM
  // =====================================================

  addCartItem(
    item: CartItem
  ): Observable<CartItem> {

    return this.http.post<CartItem>(
      this.API_URL,
      item
    );

  }


  // =====================================================
  // UPDATE CART ITEM
  // =====================================================

  updateCartItem(
    id: string,
    quantity: number
  ): Observable<CartItem> {

    return this.http.patch<CartItem>(
      `${this.API_URL}/${id}`,
      {
        quantity
      }
    );

  }


  // =====================================================
  // REMOVE CART ITEM
  // =====================================================

  removeCartItem(
    id: string
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.API_URL}/${id}`
    );

  }

}
