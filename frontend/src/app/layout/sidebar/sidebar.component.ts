import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
  ],
  template: `
    <nav class="sidebar-nav">
      <!-- Main Navigation Items -->
      <div class="sidebar-section">
        <a
          *ngFor="let item of mainNavItems"
          [routerLink]="item.route"
          routerLinkActive="active"
          class="sidebar-nav-item"
          [attr.title]="item.label"
        >
          <span class="sidebar-icon">{{ item.icon }}</span>
          <span class="sidebar-label">{{ item.label }}</span>
        </a>
      </div>

      <!-- Admin Navigation (separated by divider) -->
      <div class="sidebar-divider" *ngIf="adminNavItems.length > 0"></div>

      <div class="sidebar-section" *ngIf="adminNavItems.length > 0">
        <a
          *ngFor="let item of adminNavItems"
          [routerLink]="item.route"
          routerLinkActive="active"
          class="sidebar-nav-item"
          [attr.title]="item.label"
          *ngIf="canShowItem(item)"
        >
          <span class="sidebar-icon">{{ item.icon }}</span>
          <span class="sidebar-label">{{ item.label }}</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 8px 0;
    }

    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .sidebar-divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 8px 0;
    }

    .sidebar-nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: #333;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border-left: 3px solid transparent;
    }

    .sidebar-nav-item:hover {
      background-color: #eeeeee;
    }

    .sidebar-nav-item.active {
      background-color: #e3f2fd;
      border-left-color: #1976d2;
      color: #1976d2;
      font-weight: 500;
    }

    .sidebar-icon {
      font-size: 1.3rem;
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sidebar-label {
      font-size: 0.95rem;
      flex: 1;
    }
  `],
})
export class SidebarComponent {
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

  constructor(private readonly authService: AuthService) {}

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
