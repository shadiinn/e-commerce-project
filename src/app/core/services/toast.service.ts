import { Injectable, signal } from '@angular/core';

export type ToastType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private nextId = 0;

  toasts = signal<Toast[]>([]);

  show(
    message: string,
    type: ToastType = 'info',
    duration = 2500
  ): void {

    const toast: Toast = {
      id: this.nextId++,
      message,
      type
    };

    this.toasts.update(
      toasts => [...toasts, toast]
    );

    setTimeout(() => {
      this.remove(toast.id);
    }, duration);
  }

  success(
    message: string,
    duration = 2500
  ): void {
    this.show(
      message,
      'success',
      duration
    );
  }

  warning(
    message: string,
    duration = 3000
  ): void {
    this.show(
      message,
      'warning',
      duration
    );
  }

  error(
    message: string,
    duration = 4000
  ): void {
    this.show(
      message,
      'error',
      duration
    );
  }

  info(
    message: string,
    duration = 2500
  ): void {
    this.show(
      message,
      'info',
      duration
    );
  }

  remove(id: number): void {
    this.toasts.update(
      toasts =>
        toasts.filter(
          toast => toast.id !== id
        )
    );
  }

  clear(): void {
    this.toasts.set([]);
  }
}