import { Component, computed, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Address } from '../../../core/models/address.model';
import { AddressStorageService } from '../../../core/services/address-storage.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

const NAME_PATTERN = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
const TEXT_PATTERN = /^[A-Za-z][A-Za-z\s.,'\-\/&()]*$/;
const PLACE_PATTERN = /^[A-Za-z]+(?:[\s.'-]+[A-Za-z]+)*\s*$/;
const MAX_ADDRESSES = 2;

interface Field {
  name: string;
  label: string;
  error: string;
  full?: boolean;
  placeholder?: string;
}

/**
 * Saved addresses + address form in one component.
 * Used on the account page (manage addresses) and on checkout (selectable).
 */
@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgTemplateOutlet, ConfirmDialogComponent],
  templateUrl: './address-form.component.html'
})
export class AddressFormComponent {

  private storage = inject(AddressStorageService);
  private fb = inject(FormBuilder);

  // Key used to store the addresses (the logged-in user's email)
  email = input.required<string>();

  // Pre-fill names when adding a new address
  firstName = input('');
  lastName = input('');

  // true on checkout: shows a radio and lets the user pick an address
  selectable = input(false);


  // ---------- STATE ----------

  private version = signal(0);
  private pickedId = signal<string | null>(null);

  editingId = signal<string | null>(null);   // an address id, 'new', or null
  deletingId = signal<string | null>(null);

  // Saved addresses. Older saved data without a default -> first one is default.
  addresses = computed(() => {
    this.version();
    const list = this.storage.getAddresses(this.email());
    return list.some(a => a.isDefault)
      ? list
      : list.map((a, i) => ({ ...a, isDefault: i === 0 }));
  });

  canAdd = computed(() => this.addresses().length < MAX_ADDRESSES);

  // Address chosen on checkout (falls back to the default address)
  selectedAddress = computed(() => {
    const list = this.addresses();
    return list.find(a => a.id === this.pickedId()) ?? list.find(a => a.isDefault) ?? null;
  });


  // ---------- FORM ----------

  fields: Field[] = [
    { name: 'firstName', label: 'First Name', error: 'Letters only' },
    { name: 'lastName', label: 'Last Name', error: 'Letters only' },
    { name: 'address', label: 'Address', error: 'Enter a valid address.', full: true, placeholder: 'Street address' },
    { name: 'apartment', label: 'Apartment / Landmark', error: 'Enter a valid value.', full: true, placeholder: 'Optional' },
    { name: 'city', label: 'City', error: 'Enter a valid city.' },
    { name: 'state', label: 'State', error: 'Enter a valid state.' },
    { name: 'postalCode', label: 'Postal Code', error: 'Enter a valid 6-digit postal code.' },
    { name: 'country', label: 'Country', error: 'Country is required.' }
  ];

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
    lastName: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
    address: ['', [Validators.required, Validators.pattern(TEXT_PATTERN)]],
    apartment: ['', Validators.pattern(TEXT_PATTERN)],
    city: ['', [Validators.required, Validators.pattern(PLACE_PATTERN)]],
    state: ['', [Validators.required, Validators.pattern(PLACE_PATTERN)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    country: ['India', Validators.required]
  });

  constructor() {
    // Postal code accepts digits only (max 6)
    this.form.controls.postalCode.valueChanges.subscribe(value => {
      const digits = value.replace(/\D/g, '').slice(0, 6);
      if (digits !== value) this.form.controls.postalCode.setValue(digits);
    });
  }


  // ---------- ACTIONS ----------

  isSelected(address: Address): boolean {
    return this.selectable() && this.selectedAddress()?.id === address.id;
  }

  pick(address: Address): void {
    if (this.selectable()) this.pickedId.set(address.id);
  }

  add(): void {
    if (!this.canAdd()) return;

    this.form.reset({
      firstName: this.firstName(),
      lastName: this.lastName(),
      address: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India'
    });
    this.editingId.set('new');
  }

  edit(address: Address): void {
    this.form.reset({ ...address });
    this.editingId.set(address.id);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const list = this.addresses();
    const editing = this.editingId();
    const values = this.form.getRawValue();

    if (editing === 'new') {
      if (!this.canAdd()) return;

      const created: Address = { ...values, id: `address-${Date.now()}`, isDefault: list.length === 0 };
      this.persist([...list, created]);
      this.pickedId.set(created.id);
    } else {
      const isDefault = list.find(a => a.id === editing)?.isDefault ?? false;
      this.persist(list.map(a => (a.id === editing ? { ...values, id: a.id, isDefault } : a)));
      this.pickedId.set(editing);
    }

    this.editingId.set(null);
  }

  setDefault(id: string): void {
    this.persist(this.addresses().map(a => ({ ...a, isDefault: a.id === id })));
  }

  confirmDelete(): void {
    const id = this.deletingId();
    const remaining = this.addresses().filter(a => a.id !== id);

    // If the default address was deleted, the first remaining one becomes default
    if (remaining.length && !remaining.some(a => a.isDefault)) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }

    this.persist(remaining);

    if (this.editingId() === id) this.editingId.set(null);
    this.deletingId.set(null);
  }

  private persist(list: Address[]): void {
    this.storage.saveAddresses(this.email(), list);
    this.version.update(v => v + 1);
  }
}