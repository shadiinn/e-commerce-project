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


// =====================================================
// SAVED ADDRESS
// =====================================================

interface SavedAddress {

  id: string;

  firstName: string;

  lastName: string;

  address: string;

  apartment: string;

  city: string;

  state: string;

  postalCode: string;

  country: string;

}


// =====================================================
// COMPONENT
// =====================================================

@Component({
  selector: 'app-checkout',

  standalone: true,

  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl: './checkout.component.html',

  styleUrl: './checkout.component.css'
})
export class CheckoutComponent
  implements OnInit {


  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private store = inject(Store);

  private fb = inject(FormBuilder);


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
  // SAVED ADDRESSES
  // =====================================================

  savedAddresses =
    signal<SavedAddress[]>([]);


  selectedAddressId =
    signal<string | null>(null);


  isAddressFormOpen =
    signal(false);


  editingAddressId =
    signal<string | null>(null);


  // =====================================================
  // ADDRESS STORAGE
  // =====================================================

  private readonly ADDRESS_STORAGE_PREFIX =
    'sa_saved_addresses_';


  // =====================================================
  // CHECKOUT FORM
  // =====================================================

  checkoutForm =
    this.fb.group({

      // -----------------------------------------------
      // CONTACT
      // -----------------------------------------------

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


      // -----------------------------------------------
      // SHIPPING ADDRESS
      // -----------------------------------------------

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


      // -----------------------------------------------
      // PAYMENT
      // -----------------------------------------------

      paymentMethod: [
        'cod',
        Validators.required
      ]

    });


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    // -------------------------------------------------
    // LOAD CURRENT LOGGED-IN USER
    // -------------------------------------------------

    this.store
      .select(selectCurrentUser)
      .pipe(take(1))
      .subscribe(user => {

        if (!user) {
          return;
        }


        // ---------------------------------------------
        // PREFILL CONTACT INFORMATION
        // ---------------------------------------------

        this.checkoutForm.patchValue({

          email:
            user.email,

          phone:
            user.phone ?? ''

        });


        // ---------------------------------------------
        // LOAD SAVED ADDRESSES
        // ---------------------------------------------

        this.loadSavedAddresses();

      });


    // -------------------------------------------------
    // RELOAD SAVED ADDRESSES WHEN EMAIL CHANGES
    // -------------------------------------------------

    this.checkoutForm
      .controls.email
      .valueChanges
      .subscribe(() => {

        this.loadSavedAddresses();

      });

  }


  // =====================================================
  // ADDRESS STORAGE KEY
  // =====================================================

  private getAddressStorageKey(): string | null {

    const email =
      this.checkoutForm.controls.email.value
        ?.trim()
        .toLowerCase();


    if (!email) {

      return null;

    }


    return `${this.ADDRESS_STORAGE_PREFIX}${email}`;

  }


  // =====================================================
  // LOAD SAVED ADDRESSES
  // =====================================================

  loadSavedAddresses(): void {

    const key =
      this.getAddressStorageKey();


    if (!key) {

      this.savedAddresses.set([]);

      this.selectedAddressId.set(null);

      return;

    }


    const stored =
      localStorage.getItem(key);


    if (!stored) {

      this.savedAddresses.set([]);

      this.selectedAddressId.set(null);

      return;

    }


    try {

      const addresses =
        JSON.parse(
          stored
        ) as SavedAddress[];


      this.savedAddresses.set(
        addresses.slice(0, 2)
      );


      const selectedId =
        this.selectedAddressId();


      const stillExists =
        addresses.some(
          address =>
            address.id === selectedId
        );


      if (!stillExists) {

        this.selectedAddressId.set(
          null
        );

      }

    } catch {

      this.savedAddresses.set([]);

      this.selectedAddressId.set(null);

    }

  }


  // =====================================================
  // SAVE ADDRESSES TO LOCAL STORAGE
  // =====================================================

  private persistAddresses(): void {

    const key =
      this.getAddressStorageKey();


    if (!key) {
      return;
    }


    localStorage.setItem(
      key,
      JSON.stringify(
        this.savedAddresses()
      )
    );

  }


  // =====================================================
  // OPEN ADD ADDRESS FORM
  // =====================================================

  openAddAddress(): void {

    if (
      this.savedAddresses().length >= 2
    ) {

      return;

    }


    this.editingAddressId.set(
      null
    );


    this.selectedAddressId.set(
      null
    );


    // -----------------------------------------------
    // GET CURRENT USER
    // -----------------------------------------------

    this.store
      .select(selectCurrentUser)
      .pipe(take(1))
      .subscribe(user => {

        this.checkoutForm.patchValue({

          // -----------------------------------------
          // PREFILL USER INFORMATION
          // -----------------------------------------

          firstName:
            user?.firstName ?? '',

          lastName:
            user?.lastName ?? '',


          // -----------------------------------------
          // NEW ADDRESS FIELDS
          // -----------------------------------------

          address: '',

          apartment: '',

          city: '',

          state: '',

          postalCode: '',

          country: 'India'

        });

      });


    this.isAddressFormOpen.set(
      true
    );

  }


  // =====================================================
  // SELECT SAVED ADDRESS
  // =====================================================

  selectAddress(
    address: SavedAddress
  ): void {

    this.selectedAddressId.set(
      address.id
    );


    this.isAddressFormOpen.set(
      false
    );


    this.editingAddressId.set(
      null
    );


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
  // EDIT SAVED ADDRESS
  // =====================================================

  editAddress(
    address: SavedAddress
  ): void {

    this.editingAddressId.set(
      address.id
    );


    this.selectedAddressId.set(
      address.id
    );


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


    this.isAddressFormOpen.set(
      true
    );

  }


  // =====================================================
  // SAVE ADDRESS
  // =====================================================

  saveAddress(): void {

    const addressFields = [

      'firstName',

      'lastName',

      'address',

      'city',

      'state',

      'postalCode',

      'country'

    ] as const;


    let invalid = false;


    for (
      const field of addressFields
    ) {

      const control =
        this.checkoutForm.controls[field];


      if (control.invalid) {

        control.markAsTouched();

        invalid = true;

      }

    }


    if (invalid) {
      return;
    }


    const formValue =
      this.checkoutForm.getRawValue();


    // =================================================
    // EDIT EXISTING ADDRESS
    // =================================================

    const editingId =
      this.editingAddressId();


    if (editingId) {

      const updatedAddresses =
        this.savedAddresses().map(
          address => {

            if (
              address.id !== editingId
            ) {

              return address;

            }


            return {

              ...address,

              firstName:
                formValue.firstName!,

              lastName:
                formValue.lastName!,

              address:
                formValue.address!,

              apartment:
                formValue.apartment ?? '',

              city:
                formValue.city!,

              state:
                formValue.state!,

              postalCode:
                formValue.postalCode!,

              country:
                formValue.country!

            };

          }
        );


      this.savedAddresses.set(
        updatedAddresses
      );


      this.selectedAddressId.set(
        editingId
      );


      this.persistAddresses();


      this.isAddressFormOpen.set(
        false
      );


      this.editingAddressId.set(
        null
      );


      return;

    }


    // =================================================
    // ADD NEW ADDRESS
    // =================================================

    if (
      this.savedAddresses().length >= 2
    ) {

      return;

    }


    const newAddress: SavedAddress = {

      id:
        this.generateAddressId(),

      firstName:
        formValue.firstName!,

      lastName:
        formValue.lastName!,

      address:
        formValue.address!,

      apartment:
        formValue.apartment ?? '',

      city:
        formValue.city!,

      state:
        formValue.state!,

      postalCode:
        formValue.postalCode!,

      country:
        formValue.country!

    };


    this.savedAddresses.update(
      addresses => [
        ...addresses,
        newAddress
      ]
    );


    this.selectedAddressId.set(
      newAddress.id
    );


    this.persistAddresses();


    this.isAddressFormOpen.set(
      false
    );

  }


  // =====================================================
  // CANCEL ADDRESS FORM
  // =====================================================

  cancelAddressForm(): void {

    const selectedId =
      this.selectedAddressId();


    if (selectedId) {

      const selectedAddress =
        this.savedAddresses().find(
          address =>
            address.id === selectedId
        );


      if (selectedAddress) {

        this.checkoutForm.patchValue({

          firstName:
            selectedAddress.firstName,

          lastName:
            selectedAddress.lastName,

          address:
            selectedAddress.address,

          apartment:
            selectedAddress.apartment,

          city:
            selectedAddress.city,

          state:
            selectedAddress.state,

          postalCode:
            selectedAddress.postalCode,

          country:
            selectedAddress.country

        });

      }

    }


    this.isAddressFormOpen.set(
      false
    );


    this.editingAddressId.set(
      null
    );

  }


  // =====================================================
  // GENERATE ADDRESS ID
  // =====================================================

  private generateAddressId(): string {

    return `address-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

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
              formValue.firstName!,

            lastName:
              formValue.lastName!,

            address:
              formValue.address!,

            apartment:
              formValue.apartment ?? '',

            city:
              formValue.city!,

            state:
              formValue.state!,

            postalCode:
              formValue.postalCode!,

            country:
              formValue.country!,

            phone:
              formValue.phone!,

            email:
              formValue.email!

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