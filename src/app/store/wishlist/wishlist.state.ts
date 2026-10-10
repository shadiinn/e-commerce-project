import { WishlistItem } from '../../core/models/wishlist.model';

export interface WishlistState {

  // Authenticated user's backend wishlist
  items: WishlistItem[];

  // Guest user's local wishlist
  guestItems: string[];

  loading: boolean;

  error: string | null;

}

export const initialWishlistState: WishlistState = {

  items: [],

  guestItems: [],

  loading: false,

  error: null

};