import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Order
} from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  private readonly API_URL =
    'http://localhost:3000/orders';


  // =====================================================
  // GET CURRENT USER'S ORDERS
  // =====================================================

  getOrders(
    userId: string
  ): Observable<Order[]> {

    return this.http.get<Order[]>(
      `${this.API_URL}?userId=${userId}`
    );

  }


  // =====================================================
  // GET SINGLE ORDER
  // =====================================================

  getOrder(
    id: string
  ): Observable<Order> {

    return this.http.get<Order>(
      `${this.API_URL}/${id}`
    );

  }


  // =====================================================
  // CREATE ORDER
  // =====================================================

  createOrder(
    order: Order
  ): Observable<Order> {

    return this.http.post<Order>(
      this.API_URL,
      order
    );

  }


  // =====================================================
  // UPDATE ORDER
  // =====================================================

  updateOrder(
    id: string,
    changes: Partial<Order>
  ): Observable<Order> {

    return this.http.patch<Order>(
      `${this.API_URL}/${id}`,
      changes
    );

  }


  // =====================================================
  // DELETE ORDER
  // =====================================================

  deleteOrder(
    id: string
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.API_URL}/${id}`
    );

  }

}