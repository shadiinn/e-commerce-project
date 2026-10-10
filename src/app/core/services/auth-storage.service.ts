import { inject, Injectable } from '@angular/core';
import { AuthUser } from '../models/auth-user.model';
import { ToastService } from './toast.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthStorageService {

  router=inject(Router)

  private readonly STORAGE_KEY = 'sa_auth_user';
  toastservice=inject(ToastService)
  saveUser(user: AuthUser): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(user)
    );
    this.toastservice.success("Logged In Successfully")
  }

  getUser(): AuthUser | null {
    const storedUser =localStorage.getItem(this.STORAGE_KEY);
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
    this.router.navigate(['/login'])
    this.toastservice.success("Logged Out Successfully")
  }
}