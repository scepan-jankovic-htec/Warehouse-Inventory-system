import { Injectable, signal } from '@angular/core';
import { InventoryModel } from '../models/inventory.model';
import { MovementModel } from '../models/movement.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly inventoryState = signal<InventoryModel[]>([]);
  private readonly movementsState = signal<MovementModel[]>([]);

  readonly inventory = this.inventoryState.asReadonly();
  readonly movements = this.movementsState.asReadonly();
}
