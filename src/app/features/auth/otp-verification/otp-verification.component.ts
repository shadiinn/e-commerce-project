import {
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import { OtpService } from '../../../core/services/otp.service';

const OTP_LENGTH = 4;

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  templateUrl: './otp-verification.component.html'
})
export class OtpVerificationComponent implements OnDestroy {

  private otpService = inject(OtpService);

  email = input.required<string>();
  name = input.required<string>();

  verified = output<void>();
  cancelled = output<void>();

  digits = signal<string[]>(Array(OTP_LENGTH).fill(''));
  error = signal('');
  isResending = signal(false);

  seconds = signal(this.otpService.getSecondsLeft());

  // mm:ss
  time = computed(() => {
    const minutes = Math.floor(this.seconds() / 60);
    return `${String(minutes).padStart(2, '0')}:${String(this.seconds() % 60).padStart(2, '0')}`;
  });

  @ViewChildren('otpInput') private inputs!: QueryList<ElementRef<HTMLInputElement>>;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startTimer();
  }


  // ---------- INPUT HANDLING ----------

  onInput(event: Event, index: number): void {
    const field = event.target as HTMLInputElement;
    const digit = field.value.replace(/\D/g, '').slice(-1);

    field.value = digit; // drops anything that is not a number
    this.digits.update(list => list.map((d, i) => (i === index ? digit : d)));
    this.error.set('');

    if (digit && index < OTP_LENGTH - 1) this.focus(index + 1);
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) this.focus(index - 1);
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    this.digits.set(Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? ''));
    this.error.set('');
    this.focus(Math.min(pasted.length, OTP_LENGTH - 1));
  }

  private focus(index: number): void {
    setTimeout(() => this.inputs?.get(index)?.nativeElement.focus());
  }


  // ---------- ACTIONS ----------

  verify(): void {
    const code = this.digits().join('');

    if (code.length !== OTP_LENGTH) {
      this.error.set('Please enter the 4-digit verification code.');
    } else if (this.seconds() === 0) {
      this.error.set('This code has expired. Please request a new code.');
    } else if (this.otpService.verifyOtp(code)) {
      this.stopTimer();
      this.verified.emit();
    } else {
      this.error.set('Invalid verification code. Please try again.');
    }
  }

  resend(): void {
    if (this.seconds() > 0 || this.isResending()) return;

    this.isResending.set(true);
    this.error.set('');

    this.otpService.sendOtp(this.email(), this.name()).subscribe(sent => {
      this.isResending.set(false);

      if (!sent) {
        this.error.set('Unable to send a new code. Please try again.');
        return;
      }

      this.digits.set(Array(OTP_LENGTH).fill(''));
      this.startTimer();
      this.focus(0);
    });
  }

  cancel(): void {
    this.stopTimer();
    this.otpService.clearOtp();
    this.cancelled.emit();
  }


  // ---------- TIMER ----------

  // Every second the remaining time is read again from the service. This is more
  // accurate than subtracting 1 each tick (a hidden tab slows timers down), and it
  // is what makes the countdown continue after a refresh.
  private startTimer(): void {
    this.stopTimer();
    this.seconds.set(this.otpService.getSecondsLeft());

    if (this.seconds() === 0) {
      return;   // already expired (for example, refreshed after the code expired)
    }

    this.timer = setInterval(() => {
      this.seconds.set(this.otpService.getSecondsLeft());

      if (this.seconds() === 0) {
        this.stopTimer();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}