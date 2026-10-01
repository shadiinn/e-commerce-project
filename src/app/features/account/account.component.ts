import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import { selectAuthLoading, selectCurrentUser } from '../../store/auth/auth.selectors';
import {
  logout,
  updateProfile,
  updateProfileFailure,
  updateProfileSuccess
} from '../../store/auth/auth.actions';
import { AuthUser } from '../../core/models/auth-user.model';
import { AddressFormComponent } from '../../shared/components/address-form/address-form.component';

const NAME_PATTERN = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
const PHONE_PATTERN = /^[0-9]{10}$/;

// Profile photos are resized to this many pixels (longest side) before saving.
const PHOTO_MAX_SIZE = 300;

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, AddressFormComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent {

  private store = inject(Store);
  private actions$ = inject(Actions);
  private fb = inject(FormBuilder);

  currentUser = toSignal(this.store.select(selectCurrentUser), { initialValue: null });
  saving = toSignal(this.store.select(selectAuthLoading), { initialValue: false });

  // Profile popup state
  isEditingProfile = signal(false);
  photo = signal<string | null>(null);
  profileError = signal('');

  profileFields = [
    { name: 'firstName', label: 'First Name', type: 'text', error: 'Enter a valid first name.' },
    { name: 'lastName', label: 'Last Name', type: 'text', error: 'Enter a valid last name.' },
    { name: 'email', label: 'Email', type: 'email', error: '', note: 'Email cannot be changed.' },
    { name: 'phone', label: 'Phone', type: 'tel', error: 'Enter a valid 10 digit phone number.', placeholder: '10 digit mobile number' }
  ];

  profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
    lastName: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
    email: [{ value: '', disabled: true }],
    phone: ['', Validators.pattern(PHONE_PATTERN)]
  });

  constructor() {
    // Close the popup when the save succeeds, show a message when it fails
    this.actions$
      .pipe(ofType(updateProfileSuccess, updateProfileFailure), takeUntilDestroyed())
      .subscribe(action => {
        if ('error' in action) {
          this.profileError.set('Unable to update your profile. Please try again.');
        } else {
          this.isEditingProfile.set(false);
        }
      });
  }


  // ---------- PROFILE ----------

  openProfile(user: AuthUser): void {
    this.profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? ''
    });
    this.photo.set(user.profileImage ?? null);
    this.profileError.set('');
    this.isEditingProfile.set(true);
  }

  closeProfile(): void {
    this.isEditingProfile.set(false);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // lets the same file be chosen again

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.profileError.set('Please select a valid image file.');
      return;
    }

    this.profileError.set('');

    const reader = new FileReader();
    reader.onload = () => this.resizePhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  // A raw photo as Base64 is too large to save (json-server request and
  // localStorage), so it is shrunk to a small JPEG first.
  private resizePhoto(dataUrl: string): void {
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, PHOTO_MAX_SIZE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      this.photo.set(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.onerror = () => this.profileError.set('Could not read this image. Please try another one.');
    img.src = dataUrl;
  }

  saveProfile(): void {
    const user = this.currentUser();

    if (this.profileForm.invalid || !user) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, phone } = this.profileForm.getRawValue();
    this.profileError.set('');

    this.store.dispatch(
      updateProfile({
        id: user.id,
        changes: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          profileImage: this.photo()
        }
      })
    );
  }

  logout(): void {
    this.store.dispatch(logout());
  }
}