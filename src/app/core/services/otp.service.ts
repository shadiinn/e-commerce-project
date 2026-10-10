import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const SERVICE_ID = 'shadiinn';
const TEMPLATE_ID = 'template_kims9uf';
const PUBLIC_KEY = 'gtRMFHmQdSrdcMrUh';


const OTP_LIFETIME_MS = 90 * 1000;


const OTP_STORAGE_KEY = 'sa_otp';

@Injectable({ providedIn: 'root' })
export class OtpService {

  private http = inject(HttpClient);

  private otp: string | null = null;
  private expiresAt = 0;   // time (in milliseconds) when the code stops being valid

  constructor() {
    this.restoreOtp();
  }


  // ---------- SEND ----------

  sendOtp(email: string, name: string): Observable<boolean> {
    this.otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.expiresAt = Date.now() + OTP_LIFETIME_MS;
    this.saveOtp();

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


  // ---------- VERIFY ----------

  verifyOtp(enteredOtp: string): boolean {
    const expired = Date.now() > this.expiresAt;
    const valid = !!this.otp && !expired && enteredOtp === this.otp;


    if (valid || expired) {
      this.clearOtp();
    }

    return valid;
  }

 
  getSecondsLeft(): number {
    return Math.max(0, Math.ceil((this.expiresAt - Date.now()) / 1000));
  }

  clearOtp(): void {
    this.otp = null;
    this.expiresAt = 0;
    sessionStorage.removeItem(OTP_STORAGE_KEY);
  }



  private saveOtp(): void {
    sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify({ otp: this.otp, expiresAt: this.expiresAt }));
  }

  private restoreOtp(): void {
    try {
      const saved = JSON.parse(sessionStorage.getItem(OTP_STORAGE_KEY) ?? 'null');

      if (saved?.otp && saved?.expiresAt) {
        this.otp = saved.otp;
        this.expiresAt = saved.expiresAt;
      }
    } catch {
      sessionStorage.removeItem(OTP_STORAGE_KEY);
    }
  }
}