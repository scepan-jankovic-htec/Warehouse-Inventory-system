import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
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
