import { Routes } from '@angular/router';
import { LocationFormComponent } from './pages/location-form/location-form.component';
import { LocationListComponent } from './pages/location-list/location-list.component';

export const locationsRoutes: Routes = [
  {
    path: '',
    component: LocationListComponent
  },
  {
    path: 'new',
    component: LocationFormComponent
  },
  {
    path: ':id/edit',
    component: LocationFormComponent
  }
];
