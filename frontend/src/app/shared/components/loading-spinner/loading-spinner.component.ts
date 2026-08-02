import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-wrapper" [class.compact]="compact()">
      <div class="spinner" aria-hidden="true"></div>
      <p>{{ message() }}</p>
    </div>
  `,
  styles: `
    .loading-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      color: #475569;
    }

    .loading-wrapper.compact {
      padding: 12px;
      font-size: 13px;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid #cbd5e1;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0); }
      to { transform: rotate(360deg); }
    }

    p {
      margin: 0;
    }
  `
})
export class LoadingSpinnerComponent {
  readonly message = input<string>('Loading...');
  readonly compact = input<boolean>(false);
}
