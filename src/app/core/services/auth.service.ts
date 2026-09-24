import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private readonly API_URL =
    'http://localhost:3000/users';

  login(
    email: string,
    password: string
  ): Observable<User[]> {

    return this.http.get<User[]>(
      `${this.API_URL}?email=${email}&password=${password}`
    );
  }

  register(
    user: Omit<User, 'id'>
  ): Observable<User> {

    return this.http.post<User>(
      this.API_URL,
      user
    );
  }
}