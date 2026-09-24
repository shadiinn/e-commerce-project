import { Injectable } from '@angular/core';
import { AuthUser } from '../models/auth-user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthStorageService {

  private readonly STORAGE_KEY = 'sa_auth_user';

  saveUser(user: AuthUser): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(user)
    );
  }

  getUser(): AuthUser | null {
    const storedUser =
      localStorage.getItem(this.STORAGE_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      this.clearUser();
      return null;
    }
  }

  clearUser(): void {
    localStorage.removeItem(
      this.STORAGE_KEY
    );
  }
}