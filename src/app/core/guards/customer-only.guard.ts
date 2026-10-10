import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectCurrentUser } from '../../store/auth/auth.selectors';

// Administrators use only the admin area, never customer shopping pages.
export const customerOnlyGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectCurrentUser).pipe(
    take(1),
    map(user => user?.role === 'admin' ? router.createUrlTree(['/admin']) : true)
  );
};
