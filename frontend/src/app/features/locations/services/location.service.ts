import { Injectable, signal } from '@angular/core';
import { LocationResponse } from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly locationsState = signal<LocationResponse[]>([]);

  readonly locations = this.locationsState.asReadonly();
}
