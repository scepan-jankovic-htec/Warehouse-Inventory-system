import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TopbarComponent,
    SidebarComponent,
  ],
  template: `
    <header class="shell-header">
      <app-topbar></app-topbar>
    </header>

    <div class="shell-container">
      <aside class="shell-sidebar">
        <app-sidebar></app-sidebar>
      </aside>

      <main class="shell-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .shell-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      border-bottom: 1px solid #e0e0e0;
      background-color: #1976d2;
      color: white;
    }

    .shell-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .shell-sidebar {
      width: 280px;
      border-right: 1px solid #e0e0e0;
      overflow-y: auto;
      background-color: #fafafa;
    }

    .shell-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background-color: #ffffff;
    }
  `],
})
export class ShellComponent {}


