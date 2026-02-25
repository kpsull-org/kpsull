import { describe, it, expect } from 'vitest';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

const DEFAULT_ADDRESS = {
  street: '123 Rue de Paris',
  city: 'Paris',
  postalCode: '75001',
  country: 'France',
};

const DEFAULT_ITEM_PROPS = {
  productId: 'p1',
  productName: 'Produit A',
  price: 1000,
  quantity: 1,
};

describe('Order Entity', () => {
  describe('create', () => {
    it('should create a pending order', () => {
      // Arrange
      const items = [
        OrderItem.create({
          productId: 'product-1',
          productName: 'Produit A',
          price: 2999,
          quantity: 2,
        }).value,
      ];

      // Act
      const result = Order.create({
        creatorId: 'creator-123',
        customerId: 'customer-123',
        customerName: 'Jean Dupont',
        customerEmail: 'jean@example.com',
        items,
        shippingAddress: DEFAULT_ADDRESS,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.status.isPending).toBe(true);
      expect(result.value.orderNumber).toBeDefined();
      expect(result.value.totalAmount).toBe(5998); // 29.99 * 2
    });

    it('should generate unique order number', () => {
      // Arrange
      const items = [
        OrderItem.create({
          productId: 'product-1',
          productName: 'Produit A',
          price: 2999,
          quantity: 1,
        }).value,
      ];

      const orderProps = {
        creatorId: 'creator-123',
        customerId: 'customer-123',
        customerName: 'Jean Dupont',
        customerEmail: 'jean@example.com',
        items,
        shippingAddress: DEFAULT_ADDRESS,
      };

      // Act
      const order1 = Order.create(orderProps).value;
      const order2 = Order.create(orderProps).value;

      // Assert
      expect(order1.orderNumber).not.toBe(order2.orderNumber);
    });

    it('should fail when no items provided', () => {
      // Act
      const result = Order.create({
        creatorId: 'creator-123',
        customerId: 'customer-123',
        customerName: 'Jean Dupont',
        customerEmail: 'jean@example.com',
        items: [],
        shippingAddress: DEFAULT_ADDRESS,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('articles');
    });

    it.each([
      {
        label: 'creatorId is empty',
        props: { creatorId: '', customerId: 'customer-123', customerName: 'Jean Dupont', customerEmail: 'jean@example.com' },
        errorContains: 'Creator ID',
      },
      {
        label: 'customerId is empty',
        props: { creatorId: 'creator-123', customerId: '', customerName: 'Jean Dupont', customerEmail: 'jean@example.com' },
        errorContains: 'Customer ID',
      },
      {
        label: 'customerName is empty',
        props: { creatorId: 'creator-123', customerId: 'customer-123', customerName: '', customerEmail: 'jean@example.com' },
        errorContains: 'nom',
      },
      {
        label: 'customerEmail is empty',
        props: { creatorId: 'creator-123', customerId: 'customer-123', customerName: 'Jean Dupont', customerEmail: '' },
        errorContains: 'email',
      },
    ])('should fail when $label', ({ props, errorContains }) => {
      const result = Order.create({
        ...props,
        items: [OrderItem.create(DEFAULT_ITEM_PROPS).value],
        shippingAddress: DEFAULT_ADDRESS,
      });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(errorContains);
    });

    it('should fail when shippingAddress street is empty', () => {
      const result = Order.create({
        creatorId: 'creator-123',
        customerId: 'customer-123',
        customerName: 'Jean Dupont',
        customerEmail: 'jean@example.com',
        items: [OrderItem.create(DEFAULT_ITEM_PROPS).value],
        shippingAddress: { street: '', city: 'Paris', postalCode: '75001', country: 'France' },
      });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('adresse');
    });
  });

  describe('markAsPaid', () => {
    it('should mark order as paid', () => {
      // Arrange
      const order = createTestOrder();

      // Act
      const result = order.markAsPaid('pi_stripe_123');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(order.status.isPaid).toBe(true);
      expect(order.stripePaymentIntentId).toBe('pi_stripe_123');
    });

    it('should fail if already paid', () => {
      // Arrange
      const order = createTestOrder();
      order.markAsPaid('pi_stripe_123');

      // Act
      const result = order.markAsPaid('pi_stripe_456');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('déjà payée');
    });
  });

  describe('ship', () => {
    it('should ship a paid order', () => {
      // Arrange
      const order = createTestOrder();
      order.markAsPaid('pi_stripe_123');

      // Act
      const result = order.ship('TRACK123', 'Colissimo');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(order.status.isShipped).toBe(true);
      expect(order.trackingNumber).toBe('TRACK123');
      expect(order.carrier).toBe('Colissimo');
      expect(order.shippedAt).toBeDefined();
    });

    it('should fail to ship pending order', () => {
      // Arrange
      const order = createTestOrder();

      // Act
      const result = order.ship('TRACK123', 'Colissimo');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('payée');
    });
  });

  describe('markAsDelivered', () => {
    it('should mark shipped order as delivered', () => {
      // Arrange
      const order = createTestOrder();
      order.markAsPaid('pi_stripe_123');
      order.ship('TRACK123', 'Colissimo');

      // Act
      const result = order.markAsDelivered();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(order.status.isDelivered).toBe(true);
      expect(order.deliveredAt).toBeDefined();
    });

    it('should fail if not shipped', () => {
      // Arrange
      const order = createTestOrder();
      order.markAsPaid('pi_stripe_123');

      // Act
      const result = order.markAsDelivered();

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('cancel', () => {
    it('should cancel a pending order', () => {
      // Arrange
      const order = createTestOrder();

      // Act
      const result = order.cancel('Client a changé d\'avis');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(order.status.isCanceled).toBe(true);
      expect(order.cancellationReason).toBe('Client a changé d\'avis');
    });

    it('should cancel a paid order', () => {
      // Arrange
      const order = createTestOrder();
      order.markAsPaid('pi_stripe_123');

      // Act
      const result = order.cancel('Produit plus disponible');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(order.status.isCanceled).toBe(true);
    });

    it('should fail to cancel shipped order', () => {
      // Arrange
      const order = createTestOrder();
      order.markAsPaid('pi_stripe_123');
      order.ship('TRACK123', 'Colissimo');

      // Act
      const result = order.cancel('Trop tard');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('expédiée');
    });
  });

  describe('refund', () => {
    it('should refund a paid order', () => {
      // Arrange
      const order = createTestOrder();
      order.markAsPaid('pi_stripe_123');

      // Act
      const result = order.refund('re_stripe_123', 'Remboursement demandé');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(order.status.isRefunded).toBe(true);
      expect(order.stripeRefundId).toBe('re_stripe_123');
    });

    it('should refund a paid order without reason', () => {
      const order = createTestOrder();
      order.markAsPaid('pi_stripe_123');

      const result = order.refund('re_stripe_456');

      expect(result.isSuccess).toBe(true);
      expect(order.stripeRefundId).toBe('re_stripe_456');
      expect(order.cancellationReason).toBeUndefined();
    });

    it('should fail to refund pending order', () => {
      // Arrange
      const order = createTestOrder();

      // Act
      const result = order.refund('re_stripe_123', 'Test');

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });
});

function createTestOrder(): Order {
  const items = [
    OrderItem.create({
      productId: 'product-1',
      productName: 'Produit A',
      price: 2999,
      quantity: 1,
    }).value,
  ];

  return Order.create({
    creatorId: 'creator-123',
    customerId: 'customer-123',
    customerName: 'Jean Dupont',
    customerEmail: 'jean@example.com',
    items,
    shippingAddress: DEFAULT_ADDRESS,
  }).value;
}
