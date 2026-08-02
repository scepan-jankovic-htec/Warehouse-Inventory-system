import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('enqueue methods — adds messages in order', () => {
    const service = new NotificationService();

    service.info('Info');
    service.success('Success');
    service.warning('Warning');
    service.error('Error');

    expect(service.queue().map((m) => m.type)).toEqual(['info', 'success', 'warning', 'error']);
  });

  it('clear — removes all queued notifications', () => {
    const service = new NotificationService();
    service.error('Error');

    service.clear();

    expect(service.queue()).toEqual([]);
  });
});
