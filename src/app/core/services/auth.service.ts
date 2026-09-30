import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private readonly API_URL ='http://localhost:3000/users';

  // LOGIN

  login(email: string,password: string): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.API_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    );

  }

  // CHECK WHETHER EMAIL ALREADY EXISTS

  checkEmailExists(email: string): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.API_URL}?email=${encodeURIComponent(email)}`
    );
  }

  // REGISTER

  register(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(
      this.API_URL,
      user
    );
  }

  // UPDATE USER

  updateUser(id: string,
    changes: Partial<Omit<User, 'id'>>
  ): Observable<User> {
    return this.http.patch<User>(
      `${this.API_URL}/${id}`,
      changes
    );
  }
}