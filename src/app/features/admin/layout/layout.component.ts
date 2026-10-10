import { NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';

import { logout } from '../../../store/auth/auth.actions';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { AdminDataService } from '../admin.service';

interface AdminNavItem {
  label: string;
  path: string;
  icon: string;      // the "d" of an SVG path
  ready: boolean;    // false = the page is not built yet (shown as "Soon", not clickable)
}

/*
  The frame around every admin page:
      desktop: sidebar on the left + header on top + the page
      phone:   header with a menu button, the sidebar opens as a drawer

  The page itself is shown where <router-outlet> is.
*/
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [NgTemplateOutlet, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html'
})
export class AdminLayoutComponent implements OnDestroy {

  private store = inject(Store);
  private router = inject(Router);
  private adminData = inject(AdminDataService);

  currentUser = toSignal(this.store.select(selectCurrentUser), { initialValue: null });

  // phone: is the sidebar drawer open?
  isMenuOpen = signal(false);

  // The sidebar links. When a page is built, change its `ready` to true.
  navItems: AdminNavItem[] = [
    {
      label: 'Dashboard',
      path: '/admin',
      ready: true,
      icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'
    },
    {
      label: 'Orders',
      path: '/admin/orders',
      ready: true,
      icon: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0'
    },
    {
      label: 'Inventory',
      path: '/admin/inventory',
      ready: true,
      icon: 'M3 3h18v4H3zM5 7v14h14V7M9 11h6M9 15h6'
    },
    {
      label: 'Products',
      path: '/admin/products',
      ready: true,
      icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12'
    },
    {
      label: 'Users',
      path: '/admin/users',
      ready: true,
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'
    }
  ];

  constructor() {
    // Load all orders and users ONCE for the whole admin area (shared by all admin pages)
    this.adminData.load();
  }

  // Leaving the admin area: do not keep the data in memory
  ngOnDestroy(): void {
    this.adminData.clear();
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  logout(): void {
    this.store.dispatch(logout());
  }
}