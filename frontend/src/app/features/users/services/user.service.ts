import { Injectable, signal } from '@angular/core';
import { UserResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly usersState = signal<UserResponse[]>([]);

  readonly users = this.usersState.asReadonly();
}
