import { Order } from '../models/order.model';

export function generateOrderNumber(
  existingOrders: Order[]
): string {

  const now = new Date();

  const year =
    now.getFullYear()
      .toString()
      .slice(-2);

  const month =
    String(now.getMonth() + 1)
      .padStart(2, '0');

  const day =
    String(now.getDate())
      .padStart(2, '0');


  const datePrefix =
    `SA-${year}${month}${day}`;


  // --------------------------------------------------
  // Find today's valid order numbers
  // --------------------------------------------------

  const todayOrders =
    existingOrders.filter(order =>
      typeof order.orderNumber === 'string' &&
      order.orderNumber.startsWith(
        `${datePrefix}-`
      )
    );


  // --------------------------------------------------
  // Extract sequence numbers
  // --------------------------------------------------

  const sequenceNumbers =
    todayOrders
      .map(order => {

        const parts =
          order.orderNumber.split('-');

        return Number(parts[2]);

      })
      .filter(sequence =>
        Number.isFinite(sequence)
      );


  // --------------------------------------------------
  // Find highest sequence
  // --------------------------------------------------

  const highestSequence =
    sequenceNumbers.length > 0
      ? Math.max(...sequenceNumbers)
      : 0;


  // --------------------------------------------------
  // Generate next sequence
  // --------------------------------------------------

  const nextSequence =
    highestSequence + 1;


  // --------------------------------------------------
  // Final order number
  // --------------------------------------------------

  return `${datePrefix}-${String(
    nextSequence
  ).padStart(4, '0')}`;
}