import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { login } from '../../../store/auth/auth.actions';
import {
  selectAuthError,
  selectAuthLoading,
  selectIsAuthenticated
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);
  isAuthenticated$ =
    this.store.select(selectIsAuthenticated);

  loginForm = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6)
      ]
    ]
  });

  submit(): void {

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } =
      this.loginForm.getRawValue();

    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';

    this.store.dispatch(
      login({
        email: email!,
        password: password!,
        returnUrl
      })
    );
  }
}