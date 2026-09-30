import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChildren,
  QueryList,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  OtpService
} from '../../../core/services/otp.service';


@Component({
  selector: 'app-otp-verification',

  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './otp-verification.component.html'
})
export class OtpVerificationComponent
  implements OnDestroy {


  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private otpService =
    inject(OtpService);


  // =====================================================
  // INPUTS
  // =====================================================

  email = input.required<string>();

  name = input.required<string>();


  // =====================================================
  // OUTPUTS
  // =====================================================

  verified = output<void>();

  cancelled = output<void>();


  // =====================================================
  // OTP INPUTS
  // =====================================================

  otp = signal<string[]>([
    '',
    '',
    '',
    ''
  ]);


  // =====================================================
  // UI STATE
  // =====================================================

  errorMessage =
    signal<string | null>(null);

  isVerifying =
    signal(false);

  isResending =
    signal(false);

  secondsRemaining =
    signal(90);


  // =====================================================
  // OTP INPUT ELEMENTS
  // =====================================================

  @ViewChildren('otpInput')
  otpInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;


  // =====================================================
  // TIMER
  // =====================================================

  private timerId: ReturnType<
    typeof setInterval
  > | null = null;


  // =====================================================
  // INITIALIZATION
  // =====================================================

  constructor() {

    this.startTimer();

  }


  // =====================================================
  // OTP INPUT
  // =====================================================

  onOtpInput(
    event: Event,
    index: number
  ): void {

    const input =
      event.target as HTMLInputElement;

    const value =
      input.value.replace(/\D/g, '');

    const digit =
      value.charAt(value.length - 1);

    const currentOtp =
      [...this.otp()];

    currentOtp[index] =
      digit;

    this.otp.set(currentOtp);

    this.errorMessage.set(null);


    // Move to next input

    if (
      digit &&
      index < 3
    ) {

      this.focusInput(index + 1);

    }

  }


  // =====================================================
  // BACKSPACE
  // =====================================================

  onKeyDown(
    event: KeyboardEvent,
    index: number
  ): void {

    if (
      event.key === 'Backspace' &&
      !this.otp()[index] &&
      index > 0
    ) {

      this.focusInput(index - 1);

    }

  }


  // =====================================================
  // PASTE OTP
  // =====================================================

  onPaste(event: ClipboardEvent): void {

    event.preventDefault();

    const pasted =
      event.clipboardData
        ?.getData('text')
        .replace(/\D/g, '')
        .slice(0, 4);

    if (!pasted) {
      return;
    }


    const digits =
      pasted.split('');

    const newOtp = [
      '',
      '',
      '',
      ''
    ];

    digits.forEach(
      (digit, index) => {

        newOtp[index] =
          digit;

      }
    );

    this.otp.set(newOtp);

    this.errorMessage.set(null);


    const focusIndex =
      Math.min(
        digits.length,
        4
      ) - 1;

    if (focusIndex >= 0) {

      this.focusInput(
        focusIndex
      );

    }

  }


  // =====================================================
  // FOCUS INPUT
  // =====================================================

  private focusInput(
    index: number
  ): void {

    setTimeout(() => {

      const input =
        this.otpInputs
          ?.get(index)
          ?.nativeElement;

      input?.focus();

    });

  }


  // =====================================================
  // VERIFY OTP
  // =====================================================

  verify(): void {

    const enteredOtp =
      this.otp().join('');


    if (
      enteredOtp.length !== 4
    ) {

      this.errorMessage.set(
        'Please enter the 4-digit verification code.'
      );

      return;

    }


    if (
      this.secondsRemaining() === 0
    ) {

      this.errorMessage.set(
        'This code has expired. Please request a new code.'
      );

      return;

    }


    this.isVerifying.set(true);

    this.errorMessage.set(null);


    const isValid =
      this.otpService.verifyOtp(
        enteredOtp
      );


    if (isValid) {

      this.stopTimer();

      this.isVerifying.set(false);

      this.verified.emit();

      return;

    }


    this.isVerifying.set(false);

    this.errorMessage.set(
      'Invalid verification code. Please try again.'
    );

  }


  // =====================================================
  // RESEND OTP
  // =====================================================

  resend(): void {

    if (
      this.secondsRemaining() > 0 ||
      this.isResending()
    ) {

      return;

    }


    this.isResending.set(true);

    this.errorMessage.set(null);


    this.otpService
      .sendOtp(
        this.email(),
        this.name()
      )
      .subscribe({

        next: sent => {

          this.isResending.set(false);


          if (!sent) {

            this.errorMessage.set(
              'Unable to send a new code. Please try again.'
            );

            return;

          }


          this.otp.set([
            '',
            '',
            '',
            ''
          ]);

          this.secondsRemaining.set(90);

          this.startTimer();

          this.focusInput(0);

        },

        error: () => {

          this.isResending.set(false);

          this.errorMessage.set(
            'Unable to send a new code. Please try again.'
          );

        }

      });

  }

  // =====================================================
  // CANCEL
  // =====================================================

  cancel(): void {

    this.stopTimer();

    this.otpService.clearOtp();

    this.cancelled.emit();

  }


  // =====================================================
  // START TIMER
  // =====================================================

  private startTimer(): void {

    this.stopTimer();

    this.secondsRemaining.set(90);


    this.timerId =
      setInterval(() => {

        const remaining =
          this.secondsRemaining();


        if (remaining <= 1) {

          this.secondsRemaining.set(0);

          this.stopTimer();

          return;

        }


        this.secondsRemaining.set(
          remaining - 1
        );

      }, 1000);

  }


  // =====================================================
  // STOP TIMER
  // =====================================================

  private stopTimer(): void {

    if (this.timerId !== null) {

      clearInterval(
        this.timerId
      );

      this.timerId = null;

    }

  }


  // =====================================================
  // FORMAT TIMER
  // =====================================================

  formattedTime(): string {

    const total =
      this.secondsRemaining();

    const minutes =
      Math.floor(total / 60);

    const seconds =
      total % 60;

    return `${minutes
      .toString()
      .padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;

  }


  // =====================================================
  // CLEANUP
  // =====================================================

  ngOnDestroy(): void {

    this.stopTimer();

  }

}