import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  requiredRole?: string; // If set, only show to users with this role
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  // Navigation items accessible to all authenticated users
  readonly mainNavItems: NavItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/dashboard' },
    { label: 'Products', icon: '📦', route: '/products' },
    { label: 'Categories', icon: '🏷️', route: '/categories' },
    { label: 'Locations', icon: '🏢', route: '/locations' },
    { label: 'Inventory', icon: '📋', route: '/inventory' },
    { label: 'History', icon: '📜', route: '/history' },
  ];

  // Navigation items shown only to admins
  readonly adminNavItems: NavItem[] = [
    { label: 'Users', icon: '👥', route: '/users', requiredRole: 'ADMIN' },
  ];

  /**
   * Determine if a nav item should be visible based on the current user's role.
   * If no role is specified, the item is always visible.
   * If a role is specified, only show if user has that role.
   */
  canShowItem(item: NavItem): boolean {
    if (!item.requiredRole) {
      return true;
    }
    return this.currentUser()?.role === item.requiredRole;
  }
}
