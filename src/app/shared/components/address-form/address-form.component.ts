import {
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Address } from '../../../core/models/address.model';


// =====================================================
// VALIDATION PATTERNS
// =====================================================

const PERSON_NAME_PATTERN =
  /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;

const ADDRESS_TEXT_PATTERN =
  /^[A-Za-z][A-Za-z\s.,'\-\/&()]*$/;

const PLACE_NAME_PATTERN =
  /^[A-Za-z]+(?:[\s.'-]+[A-Za-z]+)*\s*$/;


@Component({
  selector: 'app-address-form',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl: './address-form.component.html'
})
export class AddressFormComponent
  implements OnChanges {


  // =====================================================
  // INPUTS
  // =====================================================

  address = input<Address | null>(null);

  firstName = input('');
  lastName = input('');


  // =====================================================
  // OUTPUTS
  // =====================================================

  saved = output<Address>();

  cancelled = output<void>();


  // =====================================================
  // FORM
  // =====================================================

  private fb = new FormBuilder();


  addressForm =
    this.fb.nonNullable.group({

      firstName: [
        '',
        [
          Validators.required,
          Validators.pattern(
            PERSON_NAME_PATTERN
          )
        ]
      ],

      lastName: [
        '',
        [
          Validators.required,
          Validators.pattern(
            PERSON_NAME_PATTERN
          )
        ]
      ],

      address: [
        '',
        [
          Validators.required,
          Validators.pattern(
            ADDRESS_TEXT_PATTERN
          )
        ]
      ],

      apartment: [
        '',
        Validators.pattern(
          ADDRESS_TEXT_PATTERN
        )
      ],

      city: [
        '',
        [
          Validators.required,
          Validators.pattern(
            PLACE_NAME_PATTERN
          )
        ]
      ],

      state: [
        '',
        [
          Validators.required,
          Validators.pattern(
            PLACE_NAME_PATTERN
          )
        ]
      ],

      postalCode: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^[0-9]{6}$/
          )
        ]
      ],

      country: [
        'India',
        Validators.required
      ]

    });


  // =====================================================
  // INPUT CHANGES
  // =====================================================

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      changes['address'] ||
      changes['firstName'] ||
      changes['lastName']
    ) {

      this.setFormValues();

    }

  }


  // =====================================================
  // SET FORM VALUES
  // =====================================================

  private setFormValues(): void {

    const address =
      this.address();


    if (address) {

      this.addressForm.patchValue({

        firstName:
          address.firstName,

        lastName:
          address.lastName,

        address:
          address.address,

        apartment:
          address.apartment,

        city:
          address.city,

        state:
          address.state,

        postalCode:
          address.postalCode,

        country:
          address.country

      });

      return;

    }


    this.addressForm.reset({

      firstName:
        this.firstName(),

      lastName:
        this.lastName(),

      address: '',

      apartment: '',

      city: '',

      state: '',

      postalCode: '',

      country: 'India'

    });

  }


  // =====================================================
  // POSTAL CODE
  // =====================================================

  onPostalCodeInput(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    const digits =
      input.value
        .replace(/\D/g, '')
        .slice(0, 6);


    if (
      input.value !== digits
    ) {

      input.value = digits;

    }


    this.addressForm.controls
      .postalCode
      .setValue(digits);

  }


  // =====================================================
  // SAVE
  // =====================================================

  save(): void {

    if (
      this.addressForm.invalid
    ) {

      this.addressForm.markAllAsTouched();

      return;

    }


    const value =
      this.addressForm.getRawValue();


    const address: Address = {

      id:
        this.address()?.id ??
        this.generateAddressId(),

      firstName:
        value.firstName,

      lastName:
        value.lastName,

      address:
        value.address,

      apartment:
        value.apartment,

      city:
        value.city,

      state:
        value.state,

      postalCode:
        value.postalCode,

      country:
        value.country

    };


    this.saved.emit(address);

  }


  // =====================================================
  // CANCEL
  // =====================================================

  cancel(): void {

    this.cancelled.emit();

  }


  // =====================================================
  // ID
  // =====================================================

  private generateAddressId(): string {

    return `address-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

  }

}