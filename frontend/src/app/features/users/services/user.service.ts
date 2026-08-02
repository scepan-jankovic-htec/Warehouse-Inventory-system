import { Injectable, signal } from '@angular/core';
import { UserModel } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly usersState = signal<UserModel[]>([]);

  readonly users = this.usersState.asReadonly();
}
