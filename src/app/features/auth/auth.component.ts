import { AsyncPipe, Location } from '@angular/common';

import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
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
import { ToastService } from '../../core/services/toast.service';


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
  toastService=inject(ToastService);



  // =====================================================
  // UI STATE
  // =====================================================

  isRegisterMode = signal(false);

  showLoginPassword = signal(false);

  showRegisterPassword = signal(false);

  showConfirmPassword = signal(false);


  // =====================================================
  // AUTH STATE
  // =====================================================

  loading$ =
    this.store.select(
      selectAuthLoading
    );

  error$ =
    this.store.select(
      selectAuthError
    );


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
      [
        Validators.required,
        Validators.pattern(
          /^[A-Za-z]+(?:\s[A-Za-z]+)*$/
        )
      ]
    ],

    lastName: [
      '',
      [
        Validators.required,
        Validators.pattern(
          /^[A-Za-z]+(?:\s[A-Za-z]+)*$/
        )
      ]
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
        Validators.pattern(
          /^[0-9]{10}$/
        )
      ]
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(
          /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/
        )
      ]
    ],

    confirmPassword: [
      '',
      [
        Validators.required
      ]
    ]

  }, {

    validators: this.passwordMatchValidator()

  });


  // =====================================================
  // PASSWORD MATCH VALIDATOR
  // =====================================================

  private passwordMatchValidator(): ValidatorFn {

    return (
      control: AbstractControl
    ): ValidationErrors | null => {

      const password =
        control.get('password')?.value;

      const confirmPassword =
        control.get('confirmPassword')?.value;


      if (!password || !confirmPassword) {

        return null;

      }


      return password === confirmPassword

        ? null

        : {
            passwordMismatch: true
          };

    };

  }


  // =====================================================
  // INITIAL MODE
  // =====================================================

  constructor() {

    this.isRegisterMode.set(
      this.router.url.startsWith('/register')
    );

  }


  // =====================================================
  // PASSWORD VISIBILITY
  // =====================================================

  toggleLoginPassword(): void {

    this.showLoginPassword.update(
      value => !value
    );

  }


  toggleRegisterPassword(): void {

    this.showRegisterPassword.update(
      value => !value
    );

  }


  toggleConfirmPassword(): void {

    this.showConfirmPassword.update(
      value => !value
    );

  }


  // =====================================================
  // GO TO REGISTER
  // =====================================================

  showRegister(): void {

    this.isRegisterMode.set(true);


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

    this.isRegisterMode.set(false);


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
    this.toastService.success('Login Successful');
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
    this.toastService.success('Registration Successful');

  }

}