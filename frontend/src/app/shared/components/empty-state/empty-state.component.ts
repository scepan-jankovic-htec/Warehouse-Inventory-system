import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="empty-state">
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
    </section>
  `,
  styles: `
    .empty-state {
      text-align: center;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 28px 20px;
      background: #f8fafc;
      color: #475569;
    }

    h3 {
      margin: 0 0 8px;
      font-size: 18px;
      color: #334155;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  `
})
export class EmptyStateComponent {
  readonly title = input<string>('No data found');
  readonly description = input<string>('Try updating your filters or create a new record.');
}
