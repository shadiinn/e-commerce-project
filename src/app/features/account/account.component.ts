import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { AsyncPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import { Store} from '@ngrx/store';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {BehaviorSubject,take} from 'rxjs';
import {selectCurrentUser} from '../../store/auth/auth.selectors';
import {logout,restoreAuthSuccess} from '../../store/auth/auth.actions';
import { AuthService } from '../../core/services/auth.service';
import { AuthStorageService } from '../../core/services/auth-storage.service';
import {User} from '../../core/models/user.model';
import {AuthUser} from '../../core/models/auth-user.model';
import { Address } from '../../core/models/address.model';
import {AddressStorageService} from '../../core/services/address-storage.service';
import {AddressFormComponent} from '../../shared/components/address-form/address-form.component';


const PERSON_NAME_PATTERN =/^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
const PHONE_PATTERN = /^[0-9]{10}$/;

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    ReactiveFormsModule,
    AddressFormComponent
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {


  private store =inject(Store);
  private authService =inject(AuthService);
  private authStorage =inject(AuthStorageService);
  private addressStorage =inject(AddressStorageService);
  private fb =inject(FormBuilder);

  // USER

  currentUser$ =
    this.store.select(
      selectCurrentUser
    );

  // PROFILE STATE

  isEditingProfile =signal(false);
  profileImagePreview =signal<string | null>(null);
  private profileImage =signal<string | null>(null);

  // AUTH UI STATE

  private authLoadingSubject =new BehaviorSubject<boolean>(false);
  authLoading$ =this.authLoadingSubject.asObservable();
  private authErrorSubject =new BehaviorSubject<string | null>(null);
  authError$ =this.authErrorSubject.asObservable();

  // PROFILE FORM
 
  profileForm =this.fb.nonNullable.group({

      firstName: ['',
        [
          Validators.required,
          Validators.pattern(PERSON_NAME_PATTERN)
        ]
      ],
      lastName: ['',
        [
          Validators.required,
          Validators.pattern(PERSON_NAME_PATTERN)
        ]
      ],
      phone: [
        '',
        [
          Validators.pattern(PHONE_PATTERN)
        ]
      ]
    });

  // ADDRESS STATE

  savedAddresses =signal<Address[]>([]);
  editingAddress =signal<Address | null>(null);
  isAddressFormOpen =signal(false);

  // INIT
 
  ngOnInit(): void {

    this.loadAddresses();

  }

  // START EDITING PROFILE

  startEditingProfile(): void {
    this.authErrorSubject.next(null);
    this.currentUser$
      .pipe(take(1))
      .subscribe(user => {

        if (!user) {
          return;
        }

        this.profileForm.patchValue({
          firstName:user.firstName,
          lastName:user.lastName,
          phone:user.phone ?? ''
        });

        this.profileImage.set(
          user.profileImage ?? null
        );

        this.profileImagePreview.set(
          user.profileImage ?? null
        );

        this.isEditingProfile.set(
          true
        );

      });

  }


  // =====================================================
  // CANCEL PROFILE EDITING
  // =====================================================

  cancelEditingProfile(): void {

    this.authErrorSubject.next(null);

    this.profileForm.reset();

    this.profileImage.set(null);

    this.profileImagePreview.set(null);

    this.isEditingProfile.set(false);

  }


  // =====================================================
  // PROFILE IMAGE SELECTED
  // =====================================================

  onProfileImageSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    if (!file.type.startsWith('image/')) {

      this.authErrorSubject.next(
        'Please select a valid image file.'
      );

      return;

    }


    /*
     * Keep the image reasonably small because
     * we are storing it as Base64 in db.json.
     */

    if (file.size > 2 * 1024 * 1024) {

      this.authErrorSubject.next(
        'Profile image must be smaller than 2 MB.'
      );

      return;

    }


    const reader =
      new FileReader();


    reader.onload = () => {

      const result =
        reader.result;


      if (typeof result !== 'string') {
        return;
      }


      this.profileImage.set(
        result
      );


      this.profileImagePreview.set(
        result
      );


      this.authErrorSubject.next(null);

    };


    reader.readAsDataURL(file);

  }


  // =====================================================
  // REMOVE PROFILE IMAGE
  // =====================================================

  removeProfileImage(): void {

    this.profileImage.set(null);

    this.profileImagePreview.set(null);

  }


  // =====================================================
  // SAVE PROFILE
  // =====================================================

  saveProfile(): void {

    if (this.profileForm.invalid) {

      this.profileForm.markAllAsTouched();

      return;

    }


    this.currentUser$
      .pipe(take(1))
      .subscribe(user => {

        if (!user) {
          return;
        }


        this.authLoadingSubject.next(true);

        this.authErrorSubject.next(null);


        const formValue =
          this.profileForm.getRawValue();


        const changes:
          Partial<User> = {

            firstName:
              formValue.firstName.trim(),

            lastName:
              formValue.lastName.trim(),

            phone:
              formValue.phone.trim(),

            profileImage:
              this.profileImage()

          };


        this.authService
          .updateUser(
            user.id,
            changes
          )
          .pipe(take(1))
          .subscribe({

            next: updatedUser => {

              const authUser:
                AuthUser = {

                  id:
                    updatedUser.id,

                  firstName:
                    updatedUser.firstName,

                  lastName:
                    updatedUser.lastName,

                  email:
                    updatedUser.email,

                  phone:
                    updatedUser.phone,

                  profileImage:
                    updatedUser.profileImage

                };


              /*
               * Update localStorage so the profile
               * survives a browser refresh.
               */

              this.authStorage.saveUser(
                authUser
              );


              /*
               * Update the NgRx auth state.
               */

              this.store.dispatch(
                restoreAuthSuccess({
                  user: authUser
                })
              );


              this.authLoadingSubject.next(false);

              this.isEditingProfile.set(false);

              this.profileForm.reset();

            },


            error: error => {

              console.error(
                'Profile update failed:',
                error
              );


              this.authLoadingSubject.next(false);


              this.authErrorSubject.next(
                'Unable to update your profile. Please try again.'
              );

            }

          });

      });

  }


  // =====================================================
  // LOAD ADDRESSES
  // =====================================================

  private loadAddresses(): void {

    this.currentUser$
      .pipe(take(1))
      .subscribe(user => {

        if (!user) {

          this.savedAddresses.set([]);

          return;

        }


        const addresses =
          this.addressStorage.getAddresses(
            user.email
          );


        this.savedAddresses.set(
          addresses
        );

      });

  }


  // =====================================================
  // ADD ADDRESS
  // =====================================================

  openAddAddress(): void {

    if (
      this.savedAddresses().length >= 2
    ) {

      return;

    }


    this.editingAddress.set(
      null
    );


    this.isAddressFormOpen.set(
      true
    );

  }


  // =====================================================
  // EDIT ADDRESS
  // =====================================================

  editAddress(
    address: Address
  ): void {

    this.editingAddress.set(
      address
    );


    this.isAddressFormOpen.set(
      true
    );

  }


  // =====================================================
  // ADDRESS SAVED
  // =====================================================

  onAddressSaved(
    address: Address
  ): void {

    let updatedAddresses: Address[];


    const editingId =
      this.editingAddress()?.id;


    // =================================================
    // UPDATE EXISTING ADDRESS
    // =================================================

    if (editingId) {

      updatedAddresses =
        this.savedAddresses().map(
          existingAddress =>
            existingAddress.id === editingId
              ? address
              : existingAddress
        );

    }

    // =================================================
    // ADD NEW ADDRESS
    // =================================================

    else {

      if (
        this.savedAddresses().length >= 2
      ) {

        return;

      }


      updatedAddresses = [
        ...this.savedAddresses(),
        address
      ];

    }


    this.saveAddresses(
      updatedAddresses
    );


    this.editingAddress.set(
      null
    );


    this.isAddressFormOpen.set(
      false
    );

  }


  // =====================================================
  // SAVE ADDRESSES
  // =====================================================

  private saveAddresses(
    addresses: Address[]
  ): void {

    this.currentUser$
      .pipe(take(1))
      .subscribe(user => {

        if (!user) {
          return;
        }


        this.addressStorage.saveAddresses(

          user.email,

          addresses

        );


        this.savedAddresses.set(
          addresses
        );

      });

  }


  // =====================================================
  // CANCEL ADDRESS FORM
  // =====================================================

  cancelAddressForm(): void {

    this.editingAddress.set(
      null
    );


    this.isAddressFormOpen.set(
      false
    );

  }

  logout(): void {

    this.store.dispatch(
      logout()
    );

  }

}