import { Injectable } from '@angular/core';
import { Address } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class AddressStorageService {

  private readonly storage_id ='sa_saved_addresses_';

  // STORAGE KEY

  private getStorageKey(email: string): string {
    return `${this.storage_id}${email.trim().toLowerCase()}`;
  }

  // GET ADDRESSES

  getAddresses(email: string): Address[] {
    if (!email.trim()) {
      return [];
    }
    const stored =localStorage.getItem(
        this.getStorageKey(email)
    );
    if (!stored) {
      return [];
    }
    try {
      const addresses =JSON.parse(stored) as Address[];
      return addresses.slice(0, 2);
    } catch {
      return [];
    }
  }

  // SAVE ADDRESSES

  saveAddresses(email: string,addresses: Address[]): void {
    if (!email.trim()) {
      return;
    }
    localStorage.setItem(
      this.getStorageKey(email),
      JSON.stringify(
        addresses.slice(0, 2)
      )
    );
  }
}