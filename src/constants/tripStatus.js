export const TRIP_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  DRIVER_ARRIVING: 'driver_arriving',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

export const TRIP_STATUS_LABELS = {
  requested: 'Solicitado',
  accepted: 'Aceptado',
  driver_arriving: 'Conductor en camino',
  in_progress: 'En curso',
  completed: 'Finalizado (esperando pago)',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  rejected: 'Rechazado',
};

export const PAYMENT_METHODS = {
  MERCADO_PAGO: 'mercadopago',
  STRIPE: 'stripe',
  CASH: 'cash',
};

export const PAYMENT_METHOD_LABELS = {
  mercadopago: 'Mercado Pago',
  stripe: 'Stripe',
  cash: 'Efectivo',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

