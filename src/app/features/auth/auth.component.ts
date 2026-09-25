import { AsyncPipe, Location } from '@angular/common';

import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { Store } from '@ngrx/store';

import {
  login,
  register
} from '../../store/auth/auth.actions';

import {
  selectAuthError,
  selectAuthLoading
} from '../../store/auth/auth.selectors';


@Component({
  selector: 'app-auth',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    AsyncPipe
  ],

  templateUrl: './auth.component.html',

  styleUrl: './auth.component.css'
})
export class AuthComponent {

  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private fb = inject(FormBuilder);

  private store = inject(Store);

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private location = inject(Location);


  // =====================================================
  // UI STATE
  // =====================================================

  isRegisterMode = signal(false);


  // =====================================================
  // AUTH STATE
  // =====================================================

  loading$ =
    this.store.select(selectAuthLoading);

  error$ =
    this.store.select(selectAuthError);


  // =====================================================
  // LOGIN FORM
  // =====================================================

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


  // =====================================================
  // REGISTER FORM
  // =====================================================

  registerForm = this.fb.group({

    firstName: [
      '',
      Validators.required
    ],

    lastName: [
      '',
      Validators.required
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
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


  // =====================================================
  // INITIAL MODE
  // =====================================================

  constructor() {

    this.isRegisterMode.set(
      this.router.url.startsWith('/register')
    );

  }


  // =====================================================
  // GO TO REGISTER
  // =====================================================

  showRegister(): void {

    // Change UI state first.
    // This immediately starts the animation.

    this.isRegisterMode.set(true);


    // Update the URL without triggering
    // another Angular navigation.

    const returnUrl =
      this.route.snapshot
        .queryParamMap
        .get('returnUrl');


    const url =
      returnUrl
        ? `/register?returnUrl=${encodeURIComponent(returnUrl)}`
        : '/register';


    this.location.replaceState(url);

  }


  // =====================================================
  // GO TO LOGIN
  // =====================================================

  showLogin(): void {

    // Change UI state first.
    // This reverses the exact same animation.

    this.isRegisterMode.set(false);


    // Update URL without recreating
    // or navigating the component.

    const returnUrl =
      this.route.snapshot
        .queryParamMap
        .get('returnUrl');


    const url =
      returnUrl
        ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
        : '/login';


    this.location.replaceState(url);

  }


  // =====================================================
  // LOGIN
  // =====================================================

  submitLogin(): void {

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;

    }


    const {
      email,
      password
    } =
      this.loginForm.getRawValue();


    const returnUrl =
      this.route.snapshot
        .queryParamMap
        .get('returnUrl') ?? '/';


    this.store.dispatch(

      login({

        email: email!,
        password: password!,

        returnUrl

      })

    );

  }


  // =====================================================
  // REGISTER
  // =====================================================

  submitRegister(): void {

    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

      return;

    }


    const value =
      this.registerForm.getRawValue();


    this.store.dispatch(

      register({

        user: {

          firstName:
            value.firstName!,

          lastName:
            value.lastName!,

          email:
            value.email!,

          password:
            value.password!,

          phone:
            value.phone!

        }

      })

    );

  }

}