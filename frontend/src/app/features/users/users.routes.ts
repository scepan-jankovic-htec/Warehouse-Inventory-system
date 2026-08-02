import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';
import { UserFormComponent } from './pages/user-form/user-form.component';
import { UserListComponent } from './pages/user-list/user-list.component';

export const usersRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    component: UserListComponent
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    component: UserFormComponent
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    component: UserFormComponent
  }
];
