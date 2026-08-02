import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="badgeClass()">{{ label() }}</span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      min-width: 80px;
    }

    .active, .in-stock {
      background: #dcfce7;
      color: #166534;
    }

    .inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    .low-stock {
      background: #fef3c7;
      color: #92400e;
    }

    .out-of-stock {
      background: #fecaca;
      color: #991b1b;
    }
  `
})
export class StatusBadgeComponent {
  readonly value = input<string>('');
  readonly label = input<string>('');

  readonly badgeClass = computed(() => {
    const normalized = this.value().toUpperCase();

    if (normalized === 'ACTIVE') return 'active';
    if (normalized === 'INACTIVE') return 'inactive';
    if (normalized === 'IN_STOCK') return 'in-stock';
    if (normalized === 'LOW_STOCK') return 'low-stock';
    if (normalized === 'OUT_OF_STOCK') return 'out-of-stock';

    return '';
  });
}
