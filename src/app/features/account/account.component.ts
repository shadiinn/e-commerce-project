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
import { ToastService } from '../../core/services/toast.service';
import { AddressFormComponent } from '../../shared/components/address-form/address-form.component';

const NAME_PATTERN = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
const PHONE_PATTERN = /^[0-9]{10}$/;

// The cropped photo is saved as a square of this many pixels (small, so it saves fast).
const PHOTO_OUTPUT_SIZE = 300;

// The crop square can not be made smaller than this (in screen pixels).
const MIN_CROP_SIZE = 48;

// What the user is dragging: the whole square ('move') or one of its 4 corners.
type CropMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

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
  private toast = inject(ToastService);

  currentUser = toSignal(this.store.select(selectCurrentUser), { initialValue: null });
  saving = toSignal(this.store.select(selectAuthLoading), { initialValue: false });

  // Shown inside whichever popup is open when a save fails
  profileError = signal('');


  // ===================================================================
  // 1. PERSONAL INFORMATION POPUP (name and phone)
  // ===================================================================

  isEditingProfile = signal(false);

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
    // Result of updateProfile (used by BOTH popups):
    //   success -> close the popup(s)
    //   failure -> show a message
    this.actions$
      .pipe(ofType(updateProfileSuccess, updateProfileFailure), takeUntilDestroyed())
      .subscribe(action => {
        if ('error' in action) {
          const message = 'Unable to update your profile. Please try again.';
          this.profileError.set(message);

          // no popup is open (e.g. "Remove photo" failed) -> use a toast instead
          if (!this.isEditingProfile() && !this.cropImage()) {
            this.toast.error(message);
          }
        } else {
          this.isEditingProfile.set(false);
          this.closeCrop();
        }
      });
  }

  openProfile(user: AuthUser): void {
    this.profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? ''
    });
    this.profileError.set('');
    this.isEditingProfile.set(true);
  }

  closeProfile(): void {
    this.isEditingProfile.set(false);
  }

  // Only name and phone are sent. The photo is changed separately (see below).
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
          phone: phone.trim()
        }
      })
    );
  }


  // ===================================================================
  // 2. PROFILE PHOTO (change directly from the avatar, crop to a square)
  // ===================================================================

  /*
    How it works:
      1. The user clicks the avatar -> the file picker opens (onPhotoSelected).
      2. The chosen picture is shown in the crop popup, with a square on top of it.
      3. The user drags the square to move it, or drags a corner to resize it.
         The square always stays square.
      4. "Crop & Save" cuts that part out of the ORIGINAL picture, shrinks it to
         300 x 300 pixels and saves it with updateProfile.

    All sizes below (cropSize, cropBox) are in SCREEN pixels of the picture as it is
    shown in the popup. They are converted to real picture pixels when saving.
  */

  cropImage = signal<string | null>(null);                 // the picture to crop (popup is open when set)
  cropSize = signal({ width: 0, height: 0 });              // size of the picture on screen
  cropBox = signal({ x: 0, y: 0, size: 0 });               // the square: position and side

  // The 4 corner handles of the square
  cropHandles: { mode: CropMode; position: string }[] = [
    { mode: 'nw', position: '-left-2 -top-2 cursor-nwse-resize' },
    { mode: 'ne', position: '-right-2 -top-2 cursor-nesw-resize' },
    { mode: 'sw', position: '-bottom-2 -left-2 cursor-nesw-resize' },
    { mode: 'se', position: '-bottom-2 -right-2 cursor-nwse-resize' }
  ];

  private cropSource: HTMLImageElement | null = null;      // the original picture
  private cropDrag: { mode: CropMode; startX: number; startY: number; box: { x: number; y: number; size: number } } | null = null;

  // Step 1: a file was chosen
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // lets the same file be chosen again

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.openCrop(reader.result as string);
    reader.readAsDataURL(file);
  }

  // Step 2: show the picture and put the square in the middle of it
  private openCrop(dataUrl: string): void {
    const img = new Image();

    img.onload = () => {
      // Show the picture as large as the popup allows (keeping its shape)
      const maxWidth = Math.min(360, window.innerWidth - 100);
      const maxHeight = Math.min(320, window.innerHeight * 0.5);
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      // The square starts at 80% of the shorter side, in the middle
      const size = Math.round(Math.min(width, height) * 0.8);

      this.cropSource = img;
      this.cropSize.set({ width, height });
      this.cropBox.set({ x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size });
      this.profileError.set('');
      this.cropImage.set(dataUrl);
    };

    img.onerror = () => this.toast.error('Could not read this image. Please try another one.');
    img.src = dataUrl;
  }

  // Step 3a: the pointer (mouse or finger) went down on the square or on a corner
  startCrop(event: PointerEvent): void {
    // data-mode is written on the square ("move") and on each corner in the template
    const mode = (event.target as HTMLElement).dataset['mode'] as CropMode | undefined;
    if (!mode) return;

    const area = event.currentTarget as HTMLElement;
    area.setPointerCapture(event.pointerId);   // keep receiving moves even outside the area

    const point = this.pointInArea(event, area);
    this.cropDrag = { mode, startX: point.x, startY: point.y, box: this.cropBox() };
  }

  // Step 3b: the pointer moves while it is down
  moveCrop(event: PointerEvent): void {
    const drag = this.cropDrag;
    if (!drag) return;

    const point = this.pointInArea(event, event.currentTarget as HTMLElement);
    const { width, height } = this.cropSize();
    const box = drag.box;

    // MOVE: shift the square, but keep it inside the picture
    if (drag.mode === 'move') {
      this.cropBox.set({
        size: box.size,
        x: clamp(box.x + point.x - drag.startX, 0, width - box.size),
        y: clamp(box.y + point.y - drag.startY, 0, height - box.size)
      });
      return;
    }

    // RESIZE: the corner OPPOSITE to the dragged one stays where it is (the anchor).
    // The square grows or shrinks from that anchor towards the pointer.
    const draggedLeft = drag.mode === 'nw' || drag.mode === 'sw';
    const draggedTop = drag.mode === 'nw' || drag.mode === 'ne';

    const anchorX = draggedLeft ? box.x + box.size : box.x;
    const anchorY = draggedTop ? box.y + box.size : box.y;

    // distance from the anchor to the pointer; the smaller one decides, so it stays square
    const distanceX = draggedLeft ? anchorX - point.x : point.x - anchorX;
    const distanceY = draggedTop ? anchorY - point.y : point.y - anchorY;

    // the biggest square that still fits inside the picture
    const maxSize = Math.min(
      draggedLeft ? anchorX : width - anchorX,
      draggedTop ? anchorY : height - anchorY
    );

    const size = clamp(Math.min(distanceX, distanceY), Math.min(MIN_CROP_SIZE, maxSize), maxSize);

    this.cropBox.set({
      size,
      x: draggedLeft ? anchorX - size : anchorX,
      y: draggedTop ? anchorY - size : anchorY
    });
  }

  // Step 3c: the pointer was released
  endCrop(): void {
    this.cropDrag = null;
  }

  // Pointer position inside the picture area, in screen pixels
  private pointInArea(event: PointerEvent, area: HTMLElement): { x: number; y: number } {
    const rect = area.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  // Step 4: cut the square out of the ORIGINAL picture and save it
  saveCroppedPhoto(): void {
    const user = this.currentUser();
    const img = this.cropSource;
    if (!user || !img) return;

    // screen pixels -> real picture pixels
    const ratio = img.width / this.cropSize().width;
    const box = this.cropBox();

    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_OUTPUT_SIZE;
    canvas.height = PHOTO_OUTPUT_SIZE;

    canvas.getContext('2d')?.drawImage(
      img,
      box.x * ratio, box.y * ratio, box.size * ratio, box.size * ratio,   // the part to cut out
      0, 0, PHOTO_OUTPUT_SIZE, PHOTO_OUTPUT_SIZE                          // where to draw it
    );

    this.profileError.set('');
    this.store.dispatch(
      updateProfile({
        id: user.id,
        changes: { profileImage: canvas.toDataURL('image/jpeg', 0.85) }
      })
    );
  }

  closeCrop(): void {
    this.cropImage.set(null);
    this.cropSource = null;
    this.cropDrag = null;
  }

  // "Remove photo" under the avatar
  removePhoto(): void {
    const user = this.currentUser();
    if (!user) return;

    this.store.dispatch(updateProfile({ id: user.id, changes: { profileImage: null } }));
  }

  logout(): void {
    this.store.dispatch(logout());
  }
}