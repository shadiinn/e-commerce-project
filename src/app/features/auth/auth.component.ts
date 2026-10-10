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

// Registration details are kept in sessionStorage while the OTP popup is open, so a
// page refresh can bring the popup back (sessionStorage is erased when the tab closes).
const PENDING_STORAGE_KEY = 'sa_pending_registration';

interface PendingRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

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
  pendingRegistration: PendingRegistration | null = null;


  // ---------- FORMS ----------

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      lastName: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required,Validators.pattern(/^[6-9]\d{9}$/) ]],
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

    this.restorePendingRegistration();
  }


  private restorePendingRegistration(): void {
    try {
      const saved = JSON.parse(sessionStorage.getItem(PENDING_STORAGE_KEY) ?? 'null') as PendingRegistration | null;
      if (!saved?.email) return;

      this.pendingRegistration = saved;
      this.registerForm.patchValue({ ...saved, confirmPassword: saved.password });   // so "Cancel" returns to a filled form
      this.switchMode(true);
      this.showOtp.set(true);
    } catch {
      sessionStorage.removeItem(PENDING_STORAGE_KEY);
    }
  }

  private savePendingRegistration(): void {
    if (this.pendingRegistration) {
      sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(this.pendingRegistration));
    }
  }

  private clearPendingRegistration(): void {
    this.pendingRegistration = null;
    sessionStorage.removeItem(PENDING_STORAGE_KEY);
  }


  toggleLoginPassword(): void {
    this.showLoginPassword.update(v => !v);
  }

  toggleRegisterPassword(): void {
    this.showRegisterPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }



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

  sendOtp(): void {
    const user = this.pendingRegistration;
    if (!user) return;

    this.otpService.sendOtp(user.email, user.firstName).subscribe(sent => {
      if (sent) {
        this.savePendingRegistration();   // from now on a refresh keeps the OTP popup
        this.showOtp.set(true);
      } else {
        this.clearPendingRegistration();
        this.toast.error('Unable to send verification code. Please try again.');
      }
    });
  }

  onOtpVerified(): void {
    this.showOtp.set(false);

    if (this.pendingRegistration) {
      this.store.dispatch(register({ user: this.pendingRegistration }));
      this.clearPendingRegistration();
    }
  }

  onOtpCancelled(): void {
    this.showOtp.set(false);
    this.clearPendingRegistration();
    this.otpService.clearOtp();
  }
}