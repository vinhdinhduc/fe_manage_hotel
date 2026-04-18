import { useState, useEffect } from 'react';
import { FaArrowRight, FaClipboardList, FaCommentDots, FaCircleCheck, FaClock, FaHourglassHalf, FaBan, FaBed } from 'react-icons/fa6';
import bookingService from '../../../services/booking.service';
import Spinner from '../../../components/common/Spinner/Spinner';
import { BookingStatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency, formatDate, calcNights } from '../../../utils/formatters';
import useToast from '../../../hooks/useToast';
import './MyBookingsPage.css';

const BOOKING_STEPS = [
  { status: 'Pending', label: 'Chờ xác nhận', icon: FaHourglassHalf },
  { status: 'Confirmed', label: 'Đã xác nhận', icon: FaCircleCheck },
  { status: 'Checked-in', label: 'Đang lưu trú', icon: FaBed },
  { status: 'Completed', label: 'Hoàn thành', icon: FaClock },
];

const getProgressIndex = (status) => {
  const index = BOOKING_STEPS.findIndex((step) => step.status === status);
  return index >= 0 ? index : -1;
};

const getStatusMessage = (booking) => {
  switch (booking.status) {
    case 'Pending':
      return 'Đơn đặt phòng đang chờ khách sạn xác nhận. Bạn có thể hủy trong thời gian này.';
    case 'Confirmed':
      return 'Đơn đặt phòng đã được xác nhận. Nếu cần thay đổi, hãy liên hệ lễ tân.';
    case 'Checked-in':
      return 'Khách đã nhận phòng và đang lưu trú.';
    case 'Completed':
      return 'Đặt phòng đã hoàn tất.';
    case 'Cancelled':
      return 'Đặt phòng đã bị hủy.';
    default:
      return 'Đang theo dõi trạng thái đặt phòng.';
  }
};

const getBookingTotal = (booking) => {
  const paymentTotal = Array.isArray(booking.payments)
    ? booking.payments.reduce((sum, payment) => sum + (Number(payment?.amount) || 0), 0)
    : 0;

  if (paymentTotal > 0) return paymentTotal;

  const roomPrice = Number(booking.Room?.RoomType?.base_price || booking.Room?.RoomType?.price_per_night || 0);
  return roomPrice * calcNights(booking.check_in_date, booking.check_out_date);
};

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await bookingService.myBookings();
      setBookings(res?.data || []);
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy đặt phòng này?')) return;
    try {
      await bookingService.cancel(id);
      toast.success('Đã hủy đặt phòng');
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-page__inner">
        <h1 className="my-bookings-page__title">Đặt phòng của tôi</h1>
        {loading ? <Spinner text="Đang tải..." /> : bookings.length === 0 ? (
          <div className="my-bookings-page__empty">
            <div className="my-bookings-page__empty-icon"><FaClipboardList color="#64748b" /></div>
            <p>Bạn chưa có đặt phòng nào</p>
          </div>
        ) : (
          <div className="my-bookings-page__list">
            {bookings.map(b => (
              <div key={b.id} className="booking-item">
                <div className="booking-item__header">
                  <div>
                    <p className="booking-item__id">Mã đặt phòng: <strong>#{b.id}</strong></p>
                    <p className="booking-item__room">Phòng {b.Room?.room_number} — {b.Room?.RoomType?.type_name}</p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
                <div className="booking-item__tracking">
                  {BOOKING_STEPS.map((step, index) => {
                    const activeIndex = getProgressIndex(b.status);
                    const StepIcon = step.icon;
                    const isActive = activeIndex >= index;
                    const isCurrent = activeIndex === index;
                    return (
                      <div key={step.status} className={`booking-item__step ${isActive ? 'booking-item__step--active' : ''} ${isCurrent ? 'booking-item__step--current' : ''}`}>
                        <div className="booking-item__step-icon"><StepIcon /></div>
                        <div className="booking-item__step-label">{step.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="booking-item__info">
                  <div className="booking-item__date">
                    <span className="booking-item__date-label">Nhận phòng</span>
                    <span className="booking-item__date-value">{formatDate(b.check_in_date)}</span>
                  </div>
                  <div className="booking-item__date-arrow"><FaArrowRight color="#94a3b8" /></div>
                  <div className="booking-item__date">
                    <span className="booking-item__date-label">Trả phòng</span>
                    <span className="booking-item__date-value">{formatDate(b.check_out_date)}</span>
                  </div>
                  <div className="booking-item__guests">
                    <span className="booking-item__date-label">Khách</span>
                    <span className="booking-item__date-value">{b.adults} NL{b.children > 0 ? `, ${b.children} TE` : ''}</span>
                  </div>
                  {getBookingTotal(b) > 0 && (
                    <div className="booking-item__amount">
                      <span className="booking-item__date-label">Tổng tiền</span>
                      <span className="booking-item__amount-value">{formatCurrency(getBookingTotal(b))}</span>
                    </div>
                  )}
                </div>
                <p className="booking-item__status-note">{getStatusMessage(b)}</p>
                {b.status === 'Cancelled' && b.cancel_reason && (
                  <p className="booking-item__cancel-reason"><FaBan color="#b91c1c" /> Lý do hủy: {b.cancel_reason}</p>
                )}
                {b.special_request && (
                  <p className="booking-item__request"><FaCommentDots color="#64748b" /> {b.special_request}</p>
                )}
                {b.status === 'Pending' && (
                  <div className="booking-item__actions">
                    <button className="booking-item__cancel-btn" onClick={() => handleCancel(b.id)}>Hủy đặt phòng</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
