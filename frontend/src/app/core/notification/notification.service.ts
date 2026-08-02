import { Injectable, signal } from '@angular/core';

export interface NotificationMessage {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly queueState = signal<NotificationMessage[]>([]);

  readonly queue = this.queueState.asReadonly();

  info(message: string): void {
    this.enqueue({ message, type: 'info' });
  }

  success(message: string): void {
    this.enqueue({ message, type: 'success' });
  }

  warning(message: string): void {
    this.enqueue({ message, type: 'warning' });
  }

  error(message: string): void {
    this.enqueue({ message, type: 'error' });
  }

  clear(): void {
    this.queueState.set([]);
  }

  private enqueue(item: NotificationMessage): void {
    this.queueState.update((items) => [...items, item]);
  }
}
