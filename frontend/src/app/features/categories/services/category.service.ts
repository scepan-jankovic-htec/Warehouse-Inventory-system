import { Injectable, signal } from '@angular/core';
import { CategoryModel } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly categoriesState = signal<CategoryModel[]>([]);

  readonly categories = this.categoriesState.asReadonly();
}
