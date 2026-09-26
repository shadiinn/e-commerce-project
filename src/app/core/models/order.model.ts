import {
  CheckoutItem
} from './checkout.model';


export interface OrderItem {

  productId: string;

  variantId: string;

  name: string;

  image: string;

  color: string;

  size: string;

  quantity: number;

  price: number;

  total: number;

}


export interface ShippingAddress {

  firstName: string;

  lastName: string;

  address: string;

  apartment?: string;

  city: string;

  state: string;

  postalCode: string;

  country: string;

  phone: string;

  email: string;

}


export interface CreateOrderRequest {

  items: CheckoutItem[];

  shippingAddress: ShippingAddress;

  paymentMethod:
    'cod' |
    'online';

}


export interface Order {

  id: string;

  orderNumber: string;

  userId: string;

  items: OrderItem[];

  subtotal: number;

  shipping: number;

  total: number;

  shippingAddress:
    ShippingAddress;

  paymentMethod:
    'cod' |
    'online';

  paymentStatus:

    'pending' |

    'paid' |

    'failed';

  orderStatus:

    'pending' |

    'confirmed' |

    'shipped' |

    'delivered' |

    'cancelled';

  createdAt: string;

}
