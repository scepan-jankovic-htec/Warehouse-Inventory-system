import { Injectable, signal } from '@angular/core';
import { HistoryEntryModel } from '../models/history-entry.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly historyState = signal<HistoryEntryModel[]>([]);

  readonly history = this.historyState.asReadonly();
}
