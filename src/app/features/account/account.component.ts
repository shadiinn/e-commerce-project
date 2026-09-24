import {
  Component,
  inject
} from '@angular/core';

import {
  AsyncPipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  Store
} from '@ngrx/store';

import {
  selectCurrentUser
} from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent {

  private store = inject(Store);

  currentUser$ =
    this.store.select(selectCurrentUser);

}