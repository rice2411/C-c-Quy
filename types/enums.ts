export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  DEPOSITED = 'DEPOSITED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANKING = 'BANKING'
}

export enum DeliveryType {
  SHIP = 'SHIP',
  PICKUP = 'PICKUP',
  SHIP_PROVINCE = 'SHIP_PROVINCE',
  /** Ăn tại chỗ — đơn gắn bàn (dine-in). */
  DINE_IN = 'DINE_IN',
}


