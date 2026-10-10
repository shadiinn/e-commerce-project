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

  login(email: string, _password: string): Observable<User[]> {
    // Return the email's account so the login effect can give a clear deactivation message.
    // Password checking remains in the demo login flow; a real app must do this on its server.
    return this.http.get<User[]>(
      `${this.API_URL}?email=${encodeURIComponent(email)}`
    );
  }

  // CHECK WHETHER EMAIL ALREADY EXISTS

  checkEmailExists(email: string): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.API_URL}?email=${encodeURIComponent(email)}`
    );
  }
  // GET ALL USERS (admin only; the caller must not keep or show the passwords)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(
      this.API_URL
    );
  }


  // REGISTER

  register(user: Omit<User, 'id'>): Observable<User> {
        // Everyone who registers on the site is a customer. (An admin is created by hand
    // in db.json, or by a real backend later.)
    return this.http.post<User>(
      this.API_URL,
      { ...user, role: 'customer', active: true }
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