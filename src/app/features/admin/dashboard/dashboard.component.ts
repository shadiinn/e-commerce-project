import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ChartData, ChartOptions } from 'chart.js';
import {  NgChartsModule } from 'ng2-charts';

import { CATEGORIES } from '../../../core/models/constants/categories';
import {
  ORDER_STATUSES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES
} from '../../../core/utils/order.status';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { selectAllProducts } from '../../../store/products/products.selectors';
import { AdminDataService } from '../admin.service';

// A size with this much stock (or less) is "low stock"
const LOW_STOCK_LIMIT = 5;

// Colours used by the charts
const INK = '#151515';
const GRID = '#e7e3dc';

// 1200 -> "1.2k"   150000 -> "1.5L"   (short numbers for the chart axes)
function compact(value: number): string {
  if (value >= 100000) return `${+(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${+(value / 1000).toFixed(1)}k`;
  return String(value);
}

// One row of a bar chart: a name and a number
interface ChartRow {
  label: string;
  value: number;
}

// "2026-10-06" in the browser's time zone (used to put orders into days)
function dateKey(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

/*
  The dashboard. Every number and chart is CALCULATED (computed) from three lists:
      orders   (AdminDataService)
      users    (AdminDataService)
      products (the products slice of the store)
  When any list changes, for example an order is cancelled on the orders page, all the
  numbers and charts update by themselves.

  The charts are drawn by Chart.js. ng2-charts is the Angular wrapper: the
  <canvas baseChart> directive in the template takes the chart [type], its [data] and
  its [options]. (BaseChartDirective is imported below, and the chart.js parts are
  registered once for the admin area with provideCharts() in admin.routes.ts.)
*/
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink,NgChartsModule],
  templateUrl: './dashboard.component.html'
})
export class AdminDashboardComponent {

  private store = inject(Store);
  data = inject(AdminDataService);

  currentUser = toSignal(this.store.select(selectCurrentUser), { initialValue: null });
  private products = toSignal(this.store.select(selectAllProducts), { initialValue: [] });

  // for the template
  statusLabels = ORDER_STATUS_LABELS;
  statusStyles = ORDER_STATUS_STYLES;

  // how many days the sales chart shows
  range = signal<7 | 30>(7);
  ranges: (7 | 30)[] = [7, 30];

  money(value: number): string {
    return this.data.money(value);
  }


  // ===================================================================
  // NUMBERS
  // ===================================================================

  // Cancelled orders are not sales
  private soldOrders = computed(() =>
    this.data.orders().filter(order => order.orderStatus !== 'cancelled')
  );

  private totalSales = computed(() =>
    this.soldOrders().reduce((sum, order) => sum + order.total, 0)
  );

  // Orders that still have to be shipped
  private ordersToShip = computed(() =>
    this.data.orders().filter(order => order.orderStatus === 'pending' || order.orderStatus === 'confirmed').length
  );

  private ordersToday = computed(() => {
    const today = dateKey(new Date());
    return this.data.orders().filter(order => dateKey(new Date(order.createdAt)) === today).length;
  });

  // The four cards at the top
  kpis = computed(() => {
    const sold = this.soldOrders().length;
    const average = sold === 0 ? 0 : this.totalSales() / sold;

    return [
      { label: 'Total sales', value: this.data.money(this.totalSales()), note: `Average order ${this.data.money(average)}` },
      { label: 'Orders', value: String(this.data.orders().length), note: `${this.ordersToday()} today` },
      { label: 'To ship', value: String(this.ordersToShip()), note: 'Pending or confirmed' },
      { label: 'Customers', value: String(this.data.users().filter(user => user.role !== 'admin').length), note: 'Registered accounts' }
    ];
  });


  // ===================================================================
  // CHART 1: SALES PER DAY  (line chart)
  // ===================================================================

  // the sales of every day, for the last N days (oldest first; days without orders are 0)
  private salesPerDay = computed(() => {
    // 1. add up the sales of every day
    const totals = new Map<string, number>();

    for (const order of this.soldOrders()) {
      const key = dateKey(new Date(order.createdAt));
      totals.set(key, (totals.get(key) ?? 0) + order.total);
    }

    // 2. go through the last N days
    const labels: string[] = [];
    const values: number[] = [];

    for (let daysAgo = this.range() - 1; daysAgo >= 0; daysAgo--) {
      const day = new Date();
      day.setDate(day.getDate() - daysAgo);

      labels.push(day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
      values.push(totals.get(dateKey(day)) ?? 0);
    }

    return { labels, values };
  });

  // total of the days shown (the number above the chart)
  salesTotal = computed(() =>
    this.salesPerDay().values.reduce((sum, value) => sum + value, 0)
  );

  // what the chart draws
  salesChartData = computed<ChartData<'line'>>(() => ({
    labels: this.salesPerDay().labels,
    datasets: [
      {
        data: this.salesPerDay().values,
        label: 'Sales',
        borderColor: INK,
        backgroundColor: 'rgba(21, 21, 21, 0.08)',
        fill: true,          // colour the area under the line
        tension: 0.3,        // slightly curved line
        pointBackgroundColor: '#ffffff',
        pointBorderColor: INK,
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  }));

  // how it looks and behaves
  salesChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,                // fill the box given in the template
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: context => ' ' + this.data.money(context.parsed.y ?? 0) } }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: GRID },
        ticks: { callback: value => '₹' + compact(Number(value)) }
      }
    }
  };


  // ===================================================================
  // CHART 2: ORDERS BY STATUS  (doughnut)
  // ===================================================================

  statusChartData = computed<ChartData<'doughnut'>>(() => ({
    labels: ORDER_STATUSES.map(status => ORDER_STATUS_LABELS[status]),
    datasets: [
      {
        data: ORDER_STATUSES.map(status =>
          this.data.orders().filter(order => order.orderStatus === status).length
        ),
        backgroundColor: ORDER_STATUSES.map(status => ORDER_STATUS_COLORS[status]),
        borderWidth: 0
      }
    ]
  }));

  statusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',                               // the size of the hole
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
    }
  };


  // ===================================================================
  // CHART 3: TOP SELLING PRODUCTS  (horizontal bars, by quantity sold)
  // ===================================================================

  topProducts = computed<ChartRow[]>(() => {
    const quantityByProduct = new Map<string, number>();

    for (const order of this.soldOrders()) {
      for (const item of order.items) {
        quantityByProduct.set(item.name, (quantityByProduct.get(item.name) ?? 0) + item.quantity);
      }
    }

    return [...quantityByProduct]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  });

  topProductsChartData = computed<ChartData<'bar'>>(() => ({
    labels: this.topProducts().map(row => row.label),
    datasets: [{ data: this.topProducts().map(row => row.value), backgroundColor: INK, maxBarThickness: 26 }]
  }));

  topProductsChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',                              // horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: context => ` ${context.parsed.x} sold` } }
    },
    scales: {
      x: { beginAtZero: true, grid: { color: GRID }, ticks: { precision: 0 } },
      y: { grid: { display: false } }
    }
  };


  // ===================================================================
  // CHART 4: SALES BY CATEGORY  (horizontal bars, in rupees)
  // ===================================================================

  categorySales = computed<ChartRow[]>(() => {
    // an order item only has a productId, so look the category up in the products
    const categoryOf = new Map<string, string>(
      this.products().map((product): [string, string] => [product.id, product.category])
    );
    const salesByCategory = new Map<string, number>();

    for (const order of this.soldOrders()) {
      for (const item of order.items) {
        const category = categoryOf.get(item.productId) ?? 'other';
        salesByCategory.set(category, (salesByCategory.get(category) ?? 0) + item.total);
      }
    }

    return [...salesByCategory]
      .map(([slug, value]) => ({
        label: CATEGORIES.find(category => category.slug === slug)?.name ?? slug,
        value
      }))
      .sort((a, b) => b.value - a.value);
  });

  categoryChartData = computed<ChartData<'bar'>>(() => ({
    labels: this.categorySales().map(row => row.label),
    datasets: [{ data: this.categorySales().map(row => row.value), backgroundColor: INK, maxBarThickness: 26 }]
  }));

  categoryChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: context => ' ' + this.data.money(context.parsed.x ?? 0) } }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: GRID },
        ticks: { callback: value => '₹' + compact(Number(value)) }
      },
      y: { grid: { display: false } }
    }
  };


  // ===================================================================
  // LISTS
  // ===================================================================

  recentOrders = computed(() =>
    [...this.data.orders()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
  );

  // every size that is almost sold out, the lowest stock first
  private lowStockRows = computed(() => {
    const rows: { name: string; color: string; size: string; stock: number }[] = [];

    for (const product of this.products()) {
      for (const variant of product.variants) {
        for (const size of variant.sizes) {
          if (size.stock <= LOW_STOCK_LIMIT) {
            rows.push({ name: product.name, color: variant.color, size: size.size, stock: size.stock });
          }
        }
      }
    }

    return rows.sort((a, b) => a.stock - b.stock);
  });

  lowStockCount = computed(() => this.lowStockRows().length);
  lowStockShown = computed(() => this.lowStockRows().slice(0, 8));
}