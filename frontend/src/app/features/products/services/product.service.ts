import { Injectable, signal } from '@angular/core';
import { ProductModel } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly productsState = signal<ProductModel[]>([]);

  readonly products = this.productsState.asReadonly();
}
