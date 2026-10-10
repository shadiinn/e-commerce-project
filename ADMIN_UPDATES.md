# Admin workflow updates

This update keeps the existing Angular 18, Tailwind and NgRx structure and adds the requested admin workflow improvements.

## What's changed

- Dashboard refresh button removed.
- Dashboard metrics now show net sales, order count, average value per delivered order, unique customers who ordered in the selected period, and low-stock products. Sales and order counts compare the selected 7/30-day period with the previous equal-length period.
- Top selling products and sales by category use compact product rows and progress bars, matching the supplied Threadline reference design.
- The dashboard shows only three low-stock rows. The new **Admin > Inventory** page lists all low-stock size/color variants and links to each product's stock editor.
- Orders refresh button removed. Every admin status change now asks for confirmation, and the existing status-transition rules remain in place. Cash-on-delivery orders become paid when marked delivered.
- Admin and customer order cancellation both require a selected reason. “Other” requires custom details. The reason and who cancelled the order are saved with the order.
- Product form validation now gives field-specific messages. The product list has View and Delete actions; deleting asks for confirmation.
- The only product tag shown in the admin product list is **New**, automatically derived from the creation date (30 days). Featured products are automatically selected by rating/review count rather than a manual checkbox.
- The Users page can activate/deactivate customer accounts. Deactivated users cannot log in and see a clear account-deactivated message. Admin accounts are excluded from the customer list.
- Administrators are redirected to `/admin` and blocked from customer storefront routes. The “View store” link was removed from the admin layout.

## Run locally

1. Install dependencies with `npm install`.
2. Start JSON Server in one terminal: `npx json-server db.json --port 3000`.
3. Start Angular in another terminal: `npm start`.

The current JSON Server backend is for development/demo use. It does not provide real server-side authentication or authorization; a production deployment should move password verification and role/account-status enforcement to a secure backend.
