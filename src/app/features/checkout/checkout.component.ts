import { AsyncPipe } from '@angular/common';

import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { RouterLink } from '@angular/router';

import { Store } from '@ngrx/store';

import { take } from 'rxjs';

import {
  selectCheckoutMode,
  selectCheckoutItems,
  selectCheckoutItemsWithProducts,
  selectCheckoutSubtotal
} from '../../store/checkout/checkout.selectors';

import {
  clearCheckout
} from '../../store/checkout/checkout.actions';

import {
  placeOrder
} from '../../store/orders/orders.actions';

import {
  CreateOrderRequest
} from '../../core/models/order.model';

import {
  selectCurrentUser
} from '../../store/auth/auth.selectors';

import { Address } from '../../core/models/address.model';

import {
  AddressStorageService
} from '../../core/services/address-storage.service';

import {
  AddressFormComponent
} from '../../shared/components/address-form/address-form.component';


@Component({
  selector: 'app-checkout',

  standalone: true,

  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    RouterLink,
    AddressFormComponent
  ],

  templateUrl: './checkout.component.html',

  styleUrl: './checkout.component.css'
})
export class CheckoutComponent
  implements OnInit {


  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private store =
    inject(Store);

  private fb =
    inject(FormBuilder);

  private addressStorage =
    inject(AddressStorageService);


  // =====================================================
  // CHECKOUT STATE
  // =====================================================

  checkoutMode$ =
    this.store.select(
      selectCheckoutMode
    );


  checkoutItemsRaw$ =
    this.store.select(
      selectCheckoutItems
    );


  checkoutItems$ =
    this.store.select(
      selectCheckoutItemsWithProducts
    );


  checkoutSubtotal$ =
    this.store.select(
      selectCheckoutSubtotal
    );


  // =====================================================
  // ADDRESS STATE
  // =====================================================

  savedAddresses =
    signal<Address[]>([]);


  selectedAddressId =
    signal<string | null>(null);


  isAddressFormOpen =
    signal(false);


  editingAddress =
    signal<Address | null>(null);


  // =====================================================
  // CHECKOUT FORM
  // =====================================================

  checkoutForm =
    this.fb.nonNullable.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^[0-9]{10}$/
          )
        ]
      ],

      // These values are patched from
      // the selected saved address.

      firstName: [
        '',
        Validators.required
      ],

      lastName: [
        '',
        Validators.required
      ],

      address: [
        '',
        Validators.required
      ],

      apartment: [
        ''
      ],

      city: [
        '',
        Validators.required
      ],

      state: [
        '',
        Validators.required
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
      ],

      paymentMethod: [
        'cod',
        Validators.required
      ]

    });


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.store
      .select(selectCurrentUser)
      .pipe(take(1))
      .subscribe(user => {

        if (!user) {
          return;
        }


        this.checkoutForm.patchValue({

          email:
            user.email,

          phone:
            user.phone ?? '',

          firstName:
            user.firstName ?? '',

          lastName:
            user.lastName ?? ''

        });


        this.loadSavedAddresses();

      });


    this.checkoutForm
      .controls.email
      .valueChanges
      .subscribe(() => {

        this.loadSavedAddresses();

      });

  }


  // =====================================================
  // LOAD ADDRESSES
  // =====================================================

  private loadSavedAddresses(): void {

    const email =
      this.checkoutForm.controls.email.value;


    if (!email) {

      this.savedAddresses.set([]);

      this.selectedAddressId.set(null);

      return;

    }


    const addresses =
      this.addressStorage.getAddresses(
        email
      );


    this.savedAddresses.set(
      addresses
    );


    const selectedId =
      this.selectedAddressId();


    const selectedStillExists =
      addresses.some(
        address =>
          address.id === selectedId
      );


    if (!selectedStillExists) {

      this.selectedAddressId.set(
        null
      );

    }

  }


  // =====================================================
  // OPEN ADD ADDRESS
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


    this.selectedAddressId.set(
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


    this.selectedAddressId.set(
      address.id
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

    const editingId =
      this.editingAddress()?.id;


    let updatedAddresses: Address[];


    // =================================================
    // UPDATE
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
    // ADD
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


    this.savedAddresses.set(
      updatedAddresses
    );


    this.selectedAddressId.set(
      address.id
    );


    this.persistAddresses();


    this.patchCheckoutAddress(
      address
    );


    this.editingAddress.set(
      null
    );


    this.isAddressFormOpen.set(
      false
    );

  }


  // =====================================================
  // SELECT ADDRESS
  // =====================================================

  selectAddress(
    address: Address
  ): void {

    this.selectedAddressId.set(
      address.id
    );


    this.patchCheckoutAddress(
      address
    );


    this.isAddressFormOpen.set(
      false
    );


    this.editingAddress.set(
      null
    );

  }


  // =====================================================
  // PATCH CHECKOUT ADDRESS
  // =====================================================

  private patchCheckoutAddress(
    address: Address
  ): void {

    this.checkoutForm.patchValue({

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

  }


  // =====================================================
  // CANCEL ADDRESS FORM
  // =====================================================

  cancelAddressForm(): void {

    this.isAddressFormOpen.set(
      false
    );


    this.editingAddress.set(
      null
    );

  }


  // =====================================================
  // PERSIST ADDRESSES
  // =====================================================

  private persistAddresses(): void {

    const email =
      this.checkoutForm.controls.email.value;


    if (!email) {
      return;
    }


    this.addressStorage.saveAddresses(

      email,

      this.savedAddresses()

    );

  }


  // =====================================================
  // PLACE ORDER
  // =====================================================

  placeOrder(): void {

    if (
      this.checkoutForm.invalid
    ) {

      this.checkoutForm.markAllAsTouched();

      return;

    }


    this.checkoutItems$
      .pipe(take(1))
      .subscribe(items => {

        if (!items.length) {
          return;
        }


        const formValue =
          this.checkoutForm.getRawValue();


        const request:
          CreateOrderRequest = {

          // -------------------------------------------
          // ORDER ITEMS
          // -------------------------------------------

          items:

            items.map(item => ({

              productId:
                item.product.id,

              variantId:
                item.variant.id,

              size:
                item.size,

              quantity:
                item.quantity

            })),


          // -------------------------------------------
          // SHIPPING ADDRESS
          // -------------------------------------------

          shippingAddress: {

            firstName:
              formValue.firstName,

            lastName:
              formValue.lastName,

            address:
              formValue.address,

            apartment:
              formValue.apartment,

            city:
              formValue.city,

            state:
              formValue.state,

            postalCode:
              formValue.postalCode,

            country:
              formValue.country,

            phone:
              formValue.phone,

            email:
              formValue.email

          },


          // -------------------------------------------
          // PAYMENT
          // -------------------------------------------

          paymentMethod:
            formValue.paymentMethod as
              'cod' |
              'online'

        };


        this.store.dispatch(

          placeOrder({
            request
          })

        );

      });

  }


  // =====================================================
  // CANCEL CHECKOUT
  // =====================================================

  cancelCheckout(): void {

    this.store.dispatch(
      clearCheckout()
    );

  }

}