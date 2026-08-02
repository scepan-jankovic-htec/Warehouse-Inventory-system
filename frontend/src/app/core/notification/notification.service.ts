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
}
