import { AsyncPipe, Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import {
  checkRegistrationEmail,
  login,
  register,
  registerSuccess,
  registrationEmailAvailable
} from '../../store/auth/auth.actions';
import { selectAuthError } from '../../store/auth/auth.selectors';
import { ToastService } from '../../core/services/toast.service';
import { OtpService } from '../../core/services/otp.service';
import { OtpVerificationComponent } from './otp-verification/otp-verification.component';

const NAME_PATTERN = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])\S{6,}$/;

function passwordsMatch(form: AbstractControl): ValidationErrors | null {
  const password = form.get('password')?.value;
  const confirm = form.get('confirmPassword')?.value;
  return !password || !confirm || password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, OtpVerificationComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private actions$ = inject(Actions);
  private otpService = inject(OtpService);
  private toast = inject(ToastService);

  error$ = this.store.select(selectAuthError);

  // UI state
  isRegisterMode = signal(this.router.url.startsWith('/register'));
  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  showConfirmPassword = signal(false);
  showOtp = signal(false);

  // Registration details kept until the email is verified with the OTP
  pendingRegistration: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  } | null = null;


  // ---------- FORMS ----------

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      lastName: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatch }
  );

  constructor() {
    // Email is not registered yet -> send the OTP and open the verification popup
    this.actions$
      .pipe(ofType(registrationEmailAvailable), takeUntilDestroyed())
      .subscribe(() => this.sendOtp());

    // Registered successfully -> slide back to the login form
    this.actions$
      .pipe(ofType(registerSuccess), takeUntilDestroyed())
      .subscribe(() => {
        this.registerForm.reset();
        this.showLogin();
      });
  }


  // ---------- PASSWORD VISIBILITY ----------

  toggleLoginPassword(): void {
    this.showLoginPassword.update(v => !v);
  }

  toggleRegisterPassword(): void {
    this.showRegisterPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }


  // ---------- LOGIN / REGISTER SWITCH ----------

  showRegister(): void {
    this.switchMode(true);
  }

  showLogin(): void {
    this.switchMode(false);
  }

  private switchMode(toRegister: boolean): void {
    this.isRegisterMode.set(toRegister);

    const path = toRegister ? '/register' : '/login';
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    this.location.replaceState(returnUrl ? `${path}?returnUrl=${encodeURIComponent(returnUrl)}` : path);
  }


  // ---------- LOGIN ----------

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';

    this.store.dispatch(login({ email: email!, password: password!, returnUrl }));
  }


  // ---------- REGISTER (email check -> OTP -> register) ----------

  submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const value = this.registerForm.getRawValue();

    this.pendingRegistration = {
      firstName: value.firstName!.trim(),
      lastName: value.lastName!.trim(),
      email: value.email!.trim(),
      phone: value.phone!.trim(),
      password: value.password!
    };

    this.store.dispatch(checkRegistrationEmail({ email: this.pendingRegistration.email }));
  }

  private sendOtp(): void {
    const user = this.pendingRegistration;
    if (!user) return;

    this.otpService.sendOtp(user.email, user.firstName).subscribe(sent => {
      if (sent) {
        this.showOtp.set(true);
      } else {
        this.pendingRegistration = null;
        this.toast.error('Unable to send verification code. Please try again.');
      }
    });
  }

  onOtpVerified(): void {
    this.showOtp.set(false);

    if (this.pendingRegistration) {
      this.store.dispatch(register({ user: this.pendingRegistration }));
      this.pendingRegistration = null;
    }
  }

  onOtpCancelled(): void {
    this.showOtp.set(false);
    this.pendingRegistration = null;
    this.otpService.clearOtp();
  }
}