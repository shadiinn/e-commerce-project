import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

import {
  Observable,
  from,
  map,
  catchError,
  of
} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OtpService {

  private readonly SERVICE_ID = 'shadiinn';

  private readonly TEMPLATE_ID = 'template_kims9uf';

  private readonly PUBLIC_KEY = 'gtRMFHmQdSrdcMrUh';

  private generatedOtp: string | null = null;

  private expiresAt: number | null = null;


  // =====================================================
  // GENERATE OTP
  // =====================================================

  private generateOtp(): string {

    return Math.floor(
      1000 + Math.random() * 9000
    ).toString();

  }


  // =====================================================
  // SEND OTP
  // =====================================================

  sendOtp(
    email: string,
    name: string
  ): Observable<boolean> {

    const otp = this.generateOtp();

    this.generatedOtp = otp;

    this.expiresAt =
      Date.now() + 90 * 1000;


    return from(

      emailjs.send(

        this.SERVICE_ID,

        this.TEMPLATE_ID,

        {
          email,
          name,
          passcode: otp,
          time: '1 minute 30 seconds'
        },

        {
          publicKey: this.PUBLIC_KEY
        }

      )

    ).pipe(

      map(() => true),

      catchError(error => {

        console.error(
          'OTP email failed:',
          error
        );

        this.generatedOtp = null;

        this.expiresAt = null;

        return of(false);

      })

    );

  }


  // =====================================================
  // VERIFY OTP
  // =====================================================

  verifyOtp(
    enteredOtp: string
  ): boolean {

    if (
      !this.generatedOtp ||
      !this.expiresAt
    ) {

      return false;

    }


    if (
      Date.now() > this.expiresAt
    ) {

      this.generatedOtp = null;

      this.expiresAt = null;

      return false;

    }


    if (
      enteredOtp === this.generatedOtp
    ) {

      this.generatedOtp = null;

      this.expiresAt = null;

      return true;

    }


    return false;

  }


  // =====================================================
  // CHECK EXPIRATION
  // =====================================================

  isExpired(): boolean {

    if (!this.expiresAt) {

      return true;

    }

    return Date.now() > this.expiresAt;

  }


  // =====================================================
  // CLEAR OTP
  // =====================================================

  clearOtp(): void {

    this.generatedOtp = null;

    this.expiresAt = null;

  }

}