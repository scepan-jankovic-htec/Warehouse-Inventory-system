import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
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
