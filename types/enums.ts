export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
  RETURNED = 'Returned'
}

export enum PaymentStatus {
  PAID = 'Paid',
  UNPAID = 'Unpaid',
  REFUNDED = 'Refunded'
}

export enum PaymentMethod {
  CASH = 'Cash',
  BANKING = 'Banking'
}

export enum ProductType {
  FAMILY = 'Family',
  FRIENDSHIP = 'Friendship',
  CUSTOM = 'Custom'
}