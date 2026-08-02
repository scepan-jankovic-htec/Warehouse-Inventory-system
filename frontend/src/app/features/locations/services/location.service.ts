import { Injectable, signal } from '@angular/core';
import { LocationModel } from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly locationsState = signal<LocationModel[]>([]);

  readonly locations = this.locationsState.asReadonly();
}
