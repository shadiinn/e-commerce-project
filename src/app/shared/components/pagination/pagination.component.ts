import { Component, computed, input, output } from '@angular/core';

// ===================================================================
// paginate(): cuts a list into pages. It works for any list (products, orders ...).
//
//   paginate(products, 2, 12)  ->  items 12 to 23 of the list, plus the
//                                  numbers the pagination bar needs
// ===================================================================

export interface PageResult<T> {
  items: T[];          // only the items of this page
  page: number;        // the page really shown (always between 1 and totalPages)
  totalPages: number;
  totalItems: number;  // number of items in the whole list
}

export function paginate<T>(
  allItems: T[],
  requestedPage: number,
  pageSize: number
): PageResult<T> {

  // number of pages = items / page size, rounded up (at least 1 page)
  const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));

  // keep the page inside 1..totalPages
  // (e.g. a filter leaves fewer items, so the old page no longer exists)
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  // page 1 -> items 0..11, page 2 -> items 12..23 (for a page size of 12)
  const start = (page - 1) * pageSize;

  return {
    items: allItems.slice(start, start + pageSize),
    page,
    totalPages,
    totalItems: allItems.length
  };
}

/*
  Reusable pagination bar:  Previous  1 ... 4 5 6 ... 12  Next

  The parent owns the page number. This component only shows the buttons and
  tells the parent which page the user clicked (pageChange).

  Usage (in the parent):
    result = computed(() => paginate(this.list(), this.currentPage(), 12));

    <app-pagination
      [page]="result().page"
      [totalPages]="result().totalPages"
      [totalItems]="result().totalItems"
      [pageSize]="12"
      scrollTo="my-list"
      (pageChange)="goToPage($event)"
    />
*/
@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html'
})
export class PaginationComponent {

  // ---------- INPUTS (data from the parent) ----------

  page = input.required<number>();         // current page
  totalPages = input.required<number>();
  totalItems = input.required<number>();   // number of items in the whole list
  pageSize = input.required<number>();

  // optional: id of the element to scroll to after the page changes
  scrollTo = input('');

  // ---------- OUTPUT (event to the parent) ----------

  pageChange = output<number>();


  // ---------- TEXT "Showing 13 - 24 of 40" ----------

  showingFrom = computed(() =>
    this.totalItems() === 0
      ? 0
      : (this.page() - 1) * this.pageSize() + 1
  );

  showingTo = computed(() =>
    Math.min(this.page() * this.pageSize(), this.totalItems())
  );


  // ---------- THE PAGE BUTTONS ----------

  // e.g. [1, null, 4, 5, 6, null, 12]   (null = "...")
  pageNumbers = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: (number | null)[] = [];

    for (let number = 1; number <= total; number++) {

      // Few pages: show all of them.
      // Many pages: show the first, the last and the pages next to the current one.
      const show =
        total <= 5 ||
        number === 1 ||
        number === total ||
        Math.abs(number - current) <= 1;

      if (show) {
        pages.push(number);
      } else if (pages[pages.length - 1] !== null) {
        pages.push(null);   // one "..." for each skipped group
      }
    }

    return pages;
  });


  // ---------- CLICK ----------

  goTo(page: number): void {
    // ignore clicks outside the range and on the current page
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }

    this.pageChange.emit(page);

    if (this.scrollTo()) {
      document
        .getElementById(this.scrollTo())
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}