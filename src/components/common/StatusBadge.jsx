import Badge from './Badge/Badge';
import { ROOM_STATUS_LABELS, BOOKING_STATUS_LABELS } from '../../utils/constants';

const ROOM_VARIANTS = {
  Available: 'success', Booked: 'info', Occupied: 'warning', Cleaning: 'purple', Maintenance: 'danger'
};
const BOOKING_VARIANTS = {
  Pending: 'warning', Confirmed: 'info', 'Checked-in': 'success', Completed: 'purple', Cancelled: 'danger'
};

export const RoomStatusBadge = ({ status }) => (
  <Badge label={ROOM_STATUS_LABELS[status] || status} variant={ROOM_VARIANTS[status] || 'default'} />
);

export const BookingStatusBadge = ({ status }) => (
  <Badge label={BOOKING_STATUS_LABELS[status] || status} variant={BOOKING_VARIANTS[status] || 'default'} />
);
