import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination" *ngIf="totalPages() > 0">
      <button type="button" class="btn" (click)="goPrevious()" [disabled]="isFirstPage()">← Previous</button>
      <span>Page {{ page() }} of {{ totalPages() }} ({{ totalElements() }} total)</span>
      <button type="button" class="btn" (click)="goNext()" [disabled]="isLastPage()">Next →</button>
    </div>
  `,
  styles: `
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
      flex-wrap: wrap;
      color: #475569;
      font-size: 14px;
    }

    .btn {
      border: 1px solid #cbd5e1;
      background: #fff;
      border-radius: 6px;
      padding: 7px 12px;
      cursor: pointer;
    }

    .btn:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `
})
export class PaginationComponent {
  readonly page = input<number>(1);
  readonly totalPages = input<number>(1);
  readonly totalElements = input<number>(0);

  readonly previous = output<void>();
  readonly next = output<void>();

  readonly isFirstPage = computed(() => this.page() <= 1);
  readonly isLastPage = computed(() => this.page() >= this.totalPages());

  goPrevious(): void {
    if (!this.isFirstPage()) {
      this.previous.emit();
    }
  }

  goNext(): void {
    if (!this.isLastPage()) {
      this.next.emit();
    }
  }
}
