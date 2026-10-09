import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { Order } from '../../../core/models/order.model';
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from '../../../core/utils/order.status';
import { PaginationComponent, paginate } from '../../../shared/components/pagination/pagination.component';
import { AdminDataService, AdminUser } from '../admin.service';

// One line of the table: a user, their orders and the money they spent
interface UserRow {
  user: AdminUser;
  orders: Order[];
  spent: number;
}

/*
  The Users page:
    1. the list: search, pagination
    2. a popup with ONE user: contact details, numbers and their orders

  The users and the orders come from AdminDataService (loaded when the admin area opens).
  The passwords are already removed there.
*/
@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, PaginationComponent],
  templateUrl: './users.component.html'
})
export class AdminUsersComponent {

  data = inject(AdminDataService);

  // for the template
  statusLabels = ORDER_STATUS_LABELS;
  statusStyles = ORDER_STATUS_STYLES;

  readonly pageSize = 10;

  search = signal('');
  currentPage = signal(1);


  // ===================================================================
  // 1. THE LIST
  // ===================================================================

  // Every user together with their orders and the money they spent
  private rows = computed<UserRow[]>(() =>
    this.data.users().map(user => {
      const orders = this.data.orders().filter(order => order.userId === user.id);

      // cancelled orders are not money spent
      const spent = orders
        .filter(order => order.orderStatus !== 'cancelled')
        .reduce((sum, order) => sum + order.total, 0);

      return { user, orders, spent };
    })
  );

  // The rows that match the search. New users are added at the END of the list,
  // so reversing it shows the newest user first.
  private filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();

    return [...this.rows()]
      .reverse()
      .filter(row => !term || this.matchesSearch(row.user, term));
  });

  // Only the rows of the current page
  userPage = computed(() =>
    paginate(this.filteredRows(), this.currentPage(), this.pageSize)
  );

  // The search looks at the name, the email and the phone number
  private matchesSearch(user: AdminUser, term: string): boolean {
    return [
      `${user.firstName} ${user.lastName}`,
      user.email,
      user.phone ?? ''
    ].some(text => text.toLowerCase().includes(term));
  }

  // a new search starts again from page 1
  setSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }


  // ===================================================================
  // 2. THE USER POPUP
  // ===================================================================

  // id of the user shown in the popup (null = popup closed)
  selectedUserId = signal<string | null>(null);

  selectedRow = computed(() =>
    this.rows().find(row => row.user.id === this.selectedUserId()) ?? null
  );

  // the orders of that user, newest first
  selectedOrders = computed(() =>
    [...(this.selectedRow()?.orders ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}