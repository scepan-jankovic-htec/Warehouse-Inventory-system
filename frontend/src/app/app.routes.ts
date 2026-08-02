import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { LoginComponent } from './features/auth/pages/login/login.component';

export const routes: Routes = [
	{
		path: 'login',
		component: LoginComponent
	},
	{
		path: '',
		component: ShellComponent,
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'dashboard'
			},
			{
				path: 'dashboard',
				loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes)
			},
			{
				path: 'products',
				loadChildren: () => import('./features/products/products.routes').then((m) => m.productsRoutes)
			},
			{
				path: 'categories',
				loadChildren: () => import('./features/categories/categories.routes').then((m) => m.categoriesRoutes)
			},
			{
				path: 'locations',
				loadChildren: () => import('./features/locations/locations.routes').then((m) => m.locationsRoutes)
			},
			{
				path: 'inventory',
				loadChildren: () => import('./features/inventory/inventory.routes').then((m) => m.inventoryRoutes)
			},
			{
				path: 'history',
				loadChildren: () => import('./features/history/history.routes').then((m) => m.historyRoutes)
			},
			{
				path: 'users',
				loadChildren: () => import('./features/users/users.routes').then((m) => m.usersRoutes)
			}
		]
	},
	{
		path: '**',
		redirectTo: 'dashboard'
	}
];
