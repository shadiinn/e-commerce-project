import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Product } from '../models/product.model';

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
}
