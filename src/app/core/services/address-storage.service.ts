import { Injectable } from '@angular/core';
import { Address } from '../models/address.model';

const MAX_ADDRESSES = 2;

@Injectable({ providedIn: 'root' })
export class AddressStorageService {

  private key(email: string): string {
    return `sa_saved_addresses_${email.trim().toLowerCase()}`;
  }

  getAddresses(email: string): Address[] {
    if (!email.trim()) return [];

    try {
      const saved = JSON.parse(localStorage.getItem(this.key(email)) ?? '[]') as Address[];
      return saved.slice(0, MAX_ADDRESSES);
    } catch {
      return [];
    }
  }

  saveAddresses(email: string, addresses: Address[]): void {
    if (!email.trim()) return;
    localStorage.setItem(this.key(email), JSON.stringify(addresses.slice(0, MAX_ADDRESSES)));
  }
}