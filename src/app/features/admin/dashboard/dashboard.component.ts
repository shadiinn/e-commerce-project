import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

import { CATEGORIES } from '../../../core/models/constants/categories';
import { Order } from '../../../core/models/order.model';
import { Product } from '../../../core/models/product.model';
import {
  ORDER_STATUSES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES
} from '../../../core/utils/order.status';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { selectAllProducts } from '../../../store/products/products.selectors';
import { AdminDataService } from '../admin.service';

const LOW_STOCK_LIMIT = 5;
const INK = '#151515';
const GRID = '#e7e3dc';

interface ProductPerformance {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  revenue: number;
}

interface CategoryPerformance {
  name: string;
  amount: number;
  share: number;
}

interface LowStockRow {
  productId: string;
  name: string;
  color: string;
  size: string;
  stock: number;
}

function compact(value: number): string {
  if (value >= 100000) return `${+(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${+(value / 1000).toFixed(1)}k`;
  return String(value);
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, NgChartsModule],
  templateUrl: './dashboard.component.html'
})
export class AdminDashboardComponent {
  private store = inject(Store);
  data = inject(AdminDataService);

  currentUser = toSignal(this.store.select(selectCurrentUser), {
    initialValue: null
  });

  private products = toSignal(this.store.select(selectAllProducts), {
    initialValue: [] as Product[]
  });

  statusLabels = ORDER_STATUS_LABELS;
  statusStyles = ORDER_STATUS_STYLES;
  readonly Math = Math;

  // Controls the main dashboard metrics and related sections.
  range = signal<7 | 30 | 'year'>(7);

  // Controls only the revenue chart.
  chartRange = signal<7 | 30 | 'year'>(7);

  ranges = [
    { value: 7 as const, label: '7 days' },
    { value: 30 as const, label: '30 days' },
    { value: 'year' as const, label: 'Yearly' }
  ];

  money(value: number): string {
    return this.data.money(value);
  }

  private currentPeriodStart = computed(() => {
    const start = new Date();
    const selectedRange = this.range();
    start.setHours(0, 0, 0, 0);

    if (selectedRange === 'year') {
      start.setMonth(0, 1);
    } else {
      start.setDate(start.getDate() - selectedRange + 1);
    }

    return start;
  });

  private previousPeriodStart = computed(() => {
    const start = new Date(this.currentPeriodStart().getTime());
    const selectedRange = this.range();

    if (selectedRange === 'year') {
      start.setFullYear(start.getFullYear() - 1);
    } else {
      start.setDate(start.getDate() - selectedRange);
    }

    return start;
  });

  private inRange(order: Order, start: Date, end: Date): boolean {
    const date = new Date(order.createdAt);
    return date >= start && date <= end;
  }

  private currentPeriodOrders = computed(() => {
    const start = this.currentPeriodStart();
    const now = new Date();

    return this.data.orders().filter(order => this.inRange(order, start, now));
  });

  private previousPeriodOrders = computed(() => {
    const start = this.previousPeriodStart();
    const end = new Date(this.currentPeriodStart().getTime() - 1);

    return this.data.orders().filter(order => this.inRange(order, start, end));
  });

  private netOrders = computed(() =>
    this.currentPeriodOrders().filter(order => order.orderStatus !== 'cancelled')
  );

  private previousNetOrders = computed(() =>
    this.previousPeriodOrders().filter(order => order.orderStatus !== 'cancelled')
  );

  private periodNetSales = computed(() =>
    this.netOrders().reduce((sum, order) => sum + order.total, 0)
  );

  private previousNetSales = computed(() =>
    this.previousNetOrders().reduce((sum, order) => sum + order.total, 0)
  );

  private comparison(current: number, previous: number): string {
    if (previous === 0) return '';
    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}% vs prior period`;
  }

  private completedOrders = computed(() =>
    this.netOrders().filter(order => order.orderStatus === 'delivered')
  );

  kpis = computed(() => {
    const sales = this.periodNetSales();
    const previousSales = this.previousNetSales();
    const orders = this.netOrders().length;
    const previousOrders = this.previousNetOrders().length;
    const completed = this.completedOrders();
    const completedTotal = completed.reduce((sum, order) => sum + order.total, 0);
    const customers = new Set(this.netOrders().map(order => order.userId)).size;
    const lowStockProducts = this.lowStockProductCount();

    return [
      {
        label: 'Net sales',
        value: this.money(sales),
        note: this.comparison(sales, previousSales),
        positive: sales >= previousSales
      },
      {
        label: 'Orders',
        value: String(orders),
        note: this.comparison(orders, previousOrders),
        positive: orders >= previousOrders
      },
      {
        label: 'Average order value',
        value: this.money(completed.length ? completedTotal / completed.length : 0),
        note: '',
        positive: true
      },
      {
        label: 'Customers',
        value: String(customers),
        note: '',
        positive: true
      },
      {
        label: 'Low-stock products',
        value: String(lowStockProducts).padStart(2, '0'),
        note: lowStockProducts
          ? `${this.lowStockRows().length} variants to check`
          : 'All variants looking good',
        positive: lowStockProducts === 0
      }
    ];
  });

  // Revenue chart calculations use chartRange, independently of the KPI range.
  private salesPerDay = computed(() => {
    const orders = this.data.orders().filter(
      order => order.orderStatus !== 'cancelled'
    );
    const selectedRange = this.chartRange();
    const labels: string[] = [];
    const values: number[] = [];

    if (selectedRange === 'year') {
      const annualTotals = new Map<number, number>();

      for (const order of orders) {
        const date = new Date(order.createdAt);
        if (Number.isNaN(date.getTime())) continue;

        const year = date.getFullYear();
        annualTotals.set(year, (annualTotals.get(year) ?? 0) + order.total);
      }

      const currentYear = new Date().getFullYear();
      const knownYears = [...annualTotals.keys()];
      const firstYear = knownYears.length ? Math.min(...knownYears) : currentYear;

      for (let year = firstYear; year <= currentYear; year++) {
        labels.push(String(year));
        values.push(annualTotals.get(year) ?? 0);
      }
    } else {
      const dailyTotals = new Map<string, number>();

      for (const order of orders) {
        const date = new Date(order.createdAt);
        if (Number.isNaN(date.getTime())) continue;

        const key = dateKey(date);
        dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + order.total);
      }

      for (let daysAgo = selectedRange - 1; daysAgo >= 0; daysAgo--) {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - daysAgo);

        labels.push(
          day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        );
        values.push(dailyTotals.get(dateKey(day)) ?? 0);
      }
    }

    return { labels, values };
  });

  // The chart's displayed total changes only with chartRange.
  salesTotal = computed(() =>
    this.salesPerDay().values.reduce((sum, value) => sum + value, 0)
  );

  salesChartData = computed<ChartData<'line'>>(() => ({
    labels: this.salesPerDay().labels,
    datasets: [{
      data: this.salesPerDay().values,
      label: 'Revenue',
      borderColor: INK,
      backgroundColor: 'rgba(21, 21, 21, 0.08)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: INK,
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5
    }]
  }));

  salesChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => ' ' + this.money(context.parsed.y ?? 0)
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: GRID },
        ticks: {
          callback: value => '₹' + compact(Number(value))
        }
      }
    }
  };

  statusChartData = computed<ChartData<'doughnut'>>(() => ({
    labels: ORDER_STATUSES.map(status => ORDER_STATUS_LABELS[status]),
    datasets: [{
      data: ORDER_STATUSES.map(
        status => this.currentPeriodOrders().filter(
          order => order.orderStatus === status
        ).length
      ),
      backgroundColor: ORDER_STATUSES.map(status => ORDER_STATUS_COLORS[status]),
      borderWidth: 0
    }]
  }));

  statusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8 }
      }
    }
  };

  topProducts = computed<ProductPerformance[]>(() => {
    const map = new Map<string, ProductPerformance>();

    for (const order of this.netOrders()) {
      for (const item of order.items) {
        const existing = map.get(item.productId) ?? {
          productId: item.productId,
          name: item.name,
          image: item.image,
          quantity: 0,
          revenue: 0
        };

        existing.quantity += item.quantity;
        existing.revenue += item.total;
        map.set(item.productId, existing);
      }
    }

    return [...map.values()]
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5);
  });

  topProductBarWidth(quantity: number): number {
    const highestQuantity = this.topProducts()[0]?.quantity ?? 1;
    return Math.max(4, (quantity / highestQuantity) * 100);
  }

  categorySales = computed<CategoryPerformance[]>(() => {
    const categoryByProduct = new Map<string, string>(
      this.products().map(product => [product.id, product.category] as [string, string])
    );
    const sales = new Map<string, number>();

    for (const order of this.netOrders()) {
      for (const item of order.items) {
        const category = categoryByProduct.get(item.productId) ?? 'other';
        sales.set(category, (sales.get(category) ?? 0) + item.total);
      }
    }

    const rows = [...sales.entries()]
      .map(([slug, amount]) => ({
        name: CATEGORIES.find(category => category.slug === slug)?.name ?? slug,
        amount,
        share: 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const total = rows.reduce((sum, row) => sum + row.amount, 0);
    return rows.map(row => ({
      ...row,
      share: total ? (row.amount / total) * 100 : 0
    }));
  });

  recentOrders = computed(() =>
    [...this.data.orders()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
  );

  private lowStockRows = computed<LowStockRow[]>(() => {
    const rows: LowStockRow[] = [];

    for (const product of this.products()) {
      for (const variant of product.variants) {
        for (const size of variant.sizes) {
          if (size.stock <= LOW_STOCK_LIMIT) {
            rows.push({
              productId: product.id,
              name: product.name,
              color: variant.color,
              size: size.size,
              stock: size.stock
            });
          }
        }
      }
    }

    return rows.sort((a, b) => a.stock - b.stock);
  });

  lowStockRowsForDashboard = computed(() => this.lowStockRows().slice(0, 3));

  lowStockProductCount = computed(() =>
    new Set(this.lowStockRows().map(row => row.productId)).size
  );

  lowStockVariantCount = computed(() => this.lowStockRows().length);
}
