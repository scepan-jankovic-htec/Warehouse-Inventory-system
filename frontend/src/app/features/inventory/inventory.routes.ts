import { Routes } from '@angular/router';
import { AdjustmentFormComponent } from './pages/adjustment-form/adjustment-form.component';
import { InventoryOverviewComponent } from './pages/inventory-overview/inventory-overview.component';
import { ReceiveFormComponent } from './pages/receive-form/receive-form.component';
import { TransferFormComponent } from './pages/transfer-form/transfer-form.component';

export const inventoryRoutes: Routes = [
  {
    path: '',
    component: InventoryOverviewComponent
  },
  {
    path: 'receive',
    component: ReceiveFormComponent
  },
  {
    path: 'transfer',
    component: TransferFormComponent
  },
  {
    path: 'adjust',
    component: AdjustmentFormComponent
  }
];
