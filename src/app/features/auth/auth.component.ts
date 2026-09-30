import { AsyncPipe, Location } from '@angular/common';

import {
  Component,
  inject,
  OnInit,
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
  Actions,
  ofType
} from '@ngrx/effects';

import {
  checkRegistrationEmail,
  login,
  register,
  registrationEmailAvailable
} from '../../store/auth/auth.actions';

import {
  selectAuthError,
  selectAuthLoading
} from '../../store/auth/auth.selectors';

import { ToastService } from '../../core/services/toast.service';

import { OtpService } from '../../core/services/otp.service';

import {
  OtpVerificationComponent
} from './otp-verification/otp-verification.component';


@Component({
  selector: 'app-auth',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    OtpVerificationComponent
  ],

  templateUrl: './auth.component.html',

  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {

  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private fb = inject(FormBuilder);

  private store = inject(Store);

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private location = inject(Location);

  private actions$ = inject(Actions);

  private otpService = inject(OtpService);

  toastService = inject(ToastService);


  // =====================================================
  // UI STATE
  // =====================================================

  isRegisterMode = signal(false);

  showLoginPassword = signal(false);

  showRegisterPassword = signal(false);

  showConfirmPassword = signal(false);

  showOtp = signal(false);


  // =====================================================
  // TEMPORARY REGISTRATION DATA
  // =====================================================

  pendingRegistration: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  } | null = null;


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
          /^[6-9]\d{9}$/
        )
      ]
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(
          /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])\S{6,}$/
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

    validators:
      this.passwordMatchValidator()

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
  // NG ON INIT
  // =====================================================

  ngOnInit(): void {

    // ---------------------------------------------------
    // INITIAL AUTH MODE
    // ---------------------------------------------------

    this.isRegisterMode.set(
      this.router.url.startsWith('/register')
    );


    // ---------------------------------------------------
    // EMAIL CHECK SUCCESS
    // ---------------------------------------------------

    this.actions$
      .pipe(
        ofType(
          registrationEmailAvailable
        )
      )
      .subscribe(() => {

        if (!this.pendingRegistration) {

          return;

        }


        const user =
          this.pendingRegistration;


        // ------------------------------------------------
        // SEND OTP
        // ------------------------------------------------

        this.otpService
          .sendOtp(
            user.email,
            user.firstName
          )
          .subscribe({

            next: otpSent => {

              if (!otpSent) {

                this.pendingRegistration = null;

                this.toastService.error(
                  'Unable to send verification code. Please try again.'
                );

                return;

              }


              // ------------------------------------------
              // SHOW OTP POPUP
              // ------------------------------------------

              this.showOtp.set(true);

            },

            error: error => {

              console.error(
                'OTP sending failed:',
                error
              );

              this.pendingRegistration = null;

              this.toastService.error(
                'Unable to send verification code. Please try again.'
              );

            }

          });

      });

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

  }


  // =====================================================
  // REGISTER
  // =====================================================

  submitRegister(): void {

    // ---------------------------------------------------
    // VALIDATE FORM
    // ---------------------------------------------------

    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

      return;

    }


    // ---------------------------------------------------
    // GET FORM DATA
    // ---------------------------------------------------

    const value =
      this.registerForm.getRawValue();


    // ---------------------------------------------------
    // SAVE TEMPORARY REGISTRATION
    // ---------------------------------------------------

    this.pendingRegistration = {

      firstName:
        value.firstName!.trim(),

      lastName:
        value.lastName!.trim(),

      email:
        value.email!.trim(),

      password:
        value.password!,

      phone:
        value.phone!.trim()

    };


    // ---------------------------------------------------
    // CHECK EMAIL THROUGH NGRX
    // ---------------------------------------------------

    this.store.dispatch(

      checkRegistrationEmail({

        email:
          this.pendingRegistration.email

      })

    );

  }


  // =====================================================
  // OTP VERIFIED
  // =====================================================

  onOtpVerified(): void {

    // ---------------------------------------------------
    // SAFETY CHECK
    // ---------------------------------------------------

    if (!this.pendingRegistration) {

      this.showOtp.set(false);

      return;

    }


    // ---------------------------------------------------
    // CLOSE OTP
    // ---------------------------------------------------

    this.showOtp.set(false);


    // ---------------------------------------------------
    // REGISTER USER
    // ---------------------------------------------------

    this.store.dispatch(

      register({

        user:
          this.pendingRegistration

      })

    );


    // ---------------------------------------------------
    // CLEAR TEMPORARY DATA
    // ---------------------------------------------------

    this.pendingRegistration = null;

  }


  // =====================================================
  // OTP CANCELLED
  // =====================================================

  onOtpCancelled(): void {

    this.showOtp.set(false);

    this.pendingRegistration = null;

    this.otpService.clearOtp();

  }

}