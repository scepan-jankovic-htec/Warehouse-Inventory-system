import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  readonly title = input<string>('No data found');
  readonly description = input<string>('Try updating your filters or create a new record.');
}
