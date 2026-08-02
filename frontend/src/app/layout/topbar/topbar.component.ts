import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
  ],
  template: `
    <div class="topbar-content">
      <span class="topbar-title">📦 Warehouse Inventory System</span>

      <div class="topbar-spacer"></div>

      <div class="topbar-user-section" *ngIf="currentUser() as user">
        <div class="topbar-user-info-display">
          <span class="topbar-user-name">{{ user.fullName }}</span>
          <span class="topbar-role-badge" [class]="'role-' + (user.role || 'user')">
            {{ user.role }}
          </span>
        </div>
        <button class="topbar-logout-btn" (click)="logout()" title="Logout">
          ↗ Logout
        </button>
      </div>
    </div>
  `,
  styles: [`
    .topbar-content {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0 16px;
      height: 64px;
      gap: 16px;
    }

    .topbar-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: white;
      margin: 0;
    }

    .topbar-spacer {
      flex: 1;
    }

    .topbar-user-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .topbar-user-info-display {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .topbar-user-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: white;
    }

    .topbar-role-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
    }

    .topbar-role-badge.role-ADMIN {
      background-color: rgba(255, 64, 64, 0.8);
    }

    .topbar-role-badge.role-WAREHOUSE_OPERATOR {
      background-color: rgba(33, 150, 243, 0.8);
    }

    .topbar-role-badge.role-STORE_OPERATOR {
      background-color: rgba(76, 175, 80, 0.8);
    }

    .topbar-role-badge.role-MANAGER {
      background-color: rgba(156, 39, 176, 0.8);
    }

    .topbar-logout-btn {
      padding: 6px 12px;
      background-color: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 4px;
      color: white;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .topbar-logout-btn:hover {
      background-color: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.6);
    }

    .topbar-logout-btn:active {
      background-color: rgba(255, 255, 255, 0.15);
    }
  `],
})
export class TopbarComponent implements OnInit {
  currentUser = this.authService.currentUser;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Current user is already loaded from AuthService on app init
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
