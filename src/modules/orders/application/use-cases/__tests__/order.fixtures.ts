import { Order } from '../../../domain/entities/order.entity';
import { OrderItem } from '../../../domain/entities/order-item.entity';

export function createTestOrderItem(): OrderItem {
  return OrderItem.create({
    productId: 'product-1',
    productName: 'Produit A',
    price: 2999,
    quantity: 1,
  }).value;
}

export function createPendingOrder(): Order {
  return Order.create({
    creatorId: 'creator-123',
    customerId: 'customer-123',
    customerName: 'Jean Dupont',
    customerEmail: 'jean@example.com',
    items: [createTestOrderItem()],
    shippingAddress: {
      street: '123 Rue Test',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    },
  }).value;
}

export function createPaidOrder(): Order {
  const order = createPendingOrder();
  order.markAsPaid('pi_stripe_123');
  return order;
}

export function createShippedOrder(): Order {
  const order = createPaidOrder();
  order.ship('TRACK123456', 'Colissimo');
  return order;
}
