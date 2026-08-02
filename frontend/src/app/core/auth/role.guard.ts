import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const roleGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const router = inject(Router);
	const user = authService.currentUser();

	if (user?.role === 'ADMIN') {
		return true;
	}

	return router.createUrlTree(['/dashboard']);
};
