import { Component, input, output } from '@angular/core';

/** Reusable confirmation popup (address delete, cart item removal). */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl:'./confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
  title = input('Are you sure?');
  message = input('');
  confirmText = input('Confirm');

  confirmed = output<void>();
  cancelled = output<void>();
}