import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const SERVICE_ID = 'shadiinn';
const TEMPLATE_ID = 'template_kims9uf';
const PUBLIC_KEY = 'gtRMFHmQdSrdcMrUh';

// How long a code stays valid
const OTP_LIFETIME_MS = 90 * 1000;

@Injectable({ providedIn: 'root' })
export class OtpService {

  private http = inject(HttpClient);

  private otp: string | null = null;
  private expiresAt = 0;

  // Generates a 4-digit code and emails it. Emits true on success, false on failure.
  sendOtp(email: string, name: string): Observable<boolean> {
    this.otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.expiresAt = Date.now() + OTP_LIFETIME_MS;

    return this.http
      .post(
        EMAILJS_URL,
        {
          service_id: SERVICE_ID,
          template_id: TEMPLATE_ID,
          user_id: PUBLIC_KEY,
          template_params: { email, name, passcode: this.otp, time: '1 minute 30 seconds' }
        },
        { responseType: 'text' }
      )
      .pipe(
        map(() => true),
        catchError(error => {
          console.error('OTP email failed:', error);
          this.clearOtp();
          return of(false);
        })
      );
  }

  verifyOtp(enteredOtp: string): boolean {
    const expired = Date.now() > this.expiresAt;
    const valid = !!this.otp && !expired && enteredOtp === this.otp;

    // A used or expired code can't be used again
    if (valid || expired) this.clearOtp();

    return valid;
  }

  clearOtp(): void {
    this.otp = null;
    this.expiresAt = 0;
  }
}