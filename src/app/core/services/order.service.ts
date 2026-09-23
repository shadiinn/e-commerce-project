import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateOrderRequest,
  Order
} from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  private readonly API_URL =
    'http://localhost:3000/orders';

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(
      this.API_URL
    );
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(
      `${this.API_URL}/${id}`
    );
  }

  createOrder(
    order: Order
  ): Observable<Order> {
    return this.http.post<Order>(
      this.API_URL,
      order
    );
  }

  updateOrder(
    id: string,
    changes: Partial<Order>
  ): Observable<Order> {
    return this.http.patch<Order>(
      `${this.API_URL}/${id}`,
      changes
    );
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/${id}`
    );
  }
}