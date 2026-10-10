import {
  Component,
  inject
} from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';


@Component({
  selector: 'app-toast',

  standalone: true,

  templateUrl: './toast.component.html',

  styleUrl: './toast.component.css'
})
export class ToastComponent {

  toastService = inject(ToastService);

  remove(id: number): void {
    this.toastService.remove(id);
  }
}