import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { Order } from '../../../core/models/order.model';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES
} from '../../../core/utils/order.status';
import {
  PaginationComponent,
  paginate
} from '../../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AdminDataService, AdminUser } from '../admin.service';

interface UserRow {
  user: AdminUser;
  orders: Order[];
  spent: number;
}

type UserSection = 'customers' | 'admins';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, PaginationComponent, ConfirmDialogComponent],
  templateUrl: './users.component.html'
})
export class AdminUsersComponent {
  data = inject(AdminDataService);

  statusLabels = ORDER_STATUS_LABELS;
  statusStyles = ORDER_STATUS_STYLES;

  readonly pageSize = 10;

  section = signal<UserSection>('customers');
  search = signal('');
  currentPage = signal(1);
  adminCurrentPage = signal(1);

  // Customer rows include their order history and total non-cancelled spend.
  private rows = computed<UserRow[]>(() =>
    this.data.users()
      .filter(user => user.role !== 'admin')
      .map(user => {
        const orders = this.data.orders().filter(order => order.userId === user.id);
        const spent = orders
          .filter(order => order.orderStatus !== 'cancelled')
          .reduce((sum, order) => sum + order.total, 0);

        return { user, orders, spent };
      })
  );

  private filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();

    return [...this.rows()]
      .reverse()
      .filter(row => !term || this.matchesSearch(row.user, term));
  });

  userPage = computed(() =>
    paginate(this.filteredRows(), this.currentPage(), this.pageSize)
  );

  // Admin accounts are kept in a separate list and do not use customer-only fields.
  private adminRows = computed(() => {
    const term = this.search().trim().toLowerCase();

    return [...this.data.users()]
      .filter(user => user.role === 'admin')
      .reverse()
      .filter(user => !term || this.matchesSearch(user, term));
  });

  adminPage = computed(() =>
    paginate(this.adminRows(), this.adminCurrentPage(), this.pageSize)
  );

  private matchesSearch(user: AdminUser, term: string): boolean {
    return [
      `${user.firstName} ${user.lastName}`,
      user.email,
      user.phone ?? ''
    ].some(value => value.toLowerCase().includes(term));
  }

  setSection(section: UserSection): void {
    this.section.set(section);
    this.search.set('');
    this.currentPage.set(1);
    this.adminCurrentPage.set(1);
    this.selectedUserId.set(null);
  }

  setSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
    this.adminCurrentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  goToAdminPage(page: number): void {
    this.adminCurrentPage.set(page);
  }

  // Customer details popup.
  selectedUserId = signal<string | null>(null);

  selectedRow = computed(() =>
    this.rows().find(row => row.user.id === this.selectedUserId()) ?? null
  );

  selectedOrders = computed(() =>
    [...(this.selectedRow()?.orders ?? [])]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  isActive(user: AdminUser): boolean {
    return user.active !== false;
  }

  userPendingStatus = signal<{ user: AdminUser; active: boolean } | null>(null);

  requestUserStatusChange(user: AdminUser): void {
    this.userPendingStatus.set({ user, active: !this.isActive(user) });
  }

  confirmUserStatusChange(): void {
    const pending = this.userPendingStatus();
    if (!pending) return;

    this.data.setUserActive(pending.user.id, pending.active);
    this.userPendingStatus.set(null);
  }
}
