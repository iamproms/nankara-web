import Badge from '../Badge/Badge';
import { orderStatusLabel, paymentStatusLabel } from '../../lib/payment';

const TONE = {
  // order statuses
  PENDING_PAYMENT: 'wait',
  PAID: 'go',
  IN_PRODUCTION: 'work',
  READY: 'work',
  SHIPPED: 'work',
  DELIVERED: 'done',
  CANCELLED: 'stop',
  // payment statuses
  PENDING: 'wait',
  SUCCESS: 'go',
  FAILED: 'stop',
  ABANDONED: 'stop',
};

export default function OrderStatusBadge({ status, kind = 'order' }) {
  if (!status) {
    return <Badge tone="muted">No payment</Badge>;
  }
  const label =
    kind === 'payment' ? paymentStatusLabel(status) : orderStatusLabel(status);
  return <Badge tone={TONE[status] || 'muted'}>{label}</Badge>;
}
