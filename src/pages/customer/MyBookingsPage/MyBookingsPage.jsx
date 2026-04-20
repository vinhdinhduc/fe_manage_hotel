import { useEffect, useMemo, useState } from 'react';
import { FaArrowRight, FaCalendarDays, FaClipboardList, FaCommentDots, FaCircleCheck, FaClock, FaHourglassHalf, FaBan, FaBed, FaChevronDown, FaChevronUp, FaMoneyCheckDollar } from 'react-icons/fa6';
import bookingService from '../../../services/booking.service';
import Spinner from '../../../components/common/Spinner/Spinner';
import Modal from '../../../components/common/Modal/Modal';
import Button from '../../../components/common/Button/Button';
import Pagination from '../../../components/common/Pagination/Pagination';
import { BookingStatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime, calcNights } from '../../../utils/formatters';
import useToast from '../../../hooks/useToast';
import usePaginationQuery from '../../../hooks/usePaginationQuery';
import './MyBookingsPage.css';

const BOOKING_STEPS = [
  { status: 'Pending', label: 'Chờ xác nhận', icon: FaHourglassHalf },
  { status: 'Confirmed', label: 'Đã xác nhận', icon: FaCircleCheck },
  { status: 'Checked-in', label: 'Đang lưu trú', icon: FaBed },
  { status: 'Completed', label: 'Hoàn thành', icon: FaClock },
];

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ xác nhận' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Checked-in', label: 'Đang lưu trú' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

const DEFAULT_PAGE_SIZE = 6;

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
  if (booking.invoice?.grand_total != null) return Number(booking.invoice.grand_total) || 0;

  const paymentTotal = Array.isArray(booking.payments)
    ? booking.payments.reduce((sum, payment) => sum + (Number(payment?.amount) || 0), 0)
    : 0;

  if (paymentTotal > 0) return paymentTotal;

  const roomPrice = Number(booking.Room?.RoomType?.base_price || booking.Room?.RoomType?.price_per_night || 0);
  return roomPrice * calcNights(booking.check_in_date, booking.check_out_date);
};

const normalizeBooking = (booking = {}) => {
  const room = booking.room || booking.Room || null;
  const roomType = room?.roomType || room?.RoomType || null;
  const invoice = booking.invoice || null;
  const paymentSummary = booking.payment_summary || null;
  const details = Array.isArray(booking.details) ? booking.details : [];

  const nights = Number(invoice?.nights) || calcNights(booking.check_in_date, booking.check_out_date);
  const roomTotal = Number(invoice?.room_total) || 0;
  const serviceTotal = Number(invoice?.service_total) || 0;
  const grandTotal = Number(invoice?.grand_total) || roomTotal + serviceTotal;

  const paidTotal = Number(paymentSummary?.paid_total) || 0;
  const refundedTotal = Number(paymentSummary?.refunded_total) || 0;
  const netPaid = Number(paymentSummary?.net_paid) || paidTotal - refundedTotal;
  const balanceDue = Number(paymentSummary?.balance_due);

  return {
    ...booking,
    id: booking.id ?? booking.booking_id ?? null,
    Room: room
      ? {
          ...room,
          room_number: room.room_number || room.number || '',
          RoomType: roomType
            ? {
                ...roomType,
                type_name: roomType.type_name || roomType.name || '',
              }
            : null,
        }
      : null,
    details,
    invoice: {
      nights,
      room_total: roomTotal,
      service_total: serviceTotal,
      grand_total: grandTotal,
    },
    payment_summary: {
      paid_total: paidTotal,
      refunded_total: refundedTotal,
      pending_total: Number(paymentSummary?.pending_total) || 0,
      net_paid: netPaid,
      balance_due: Number.isFinite(balanceDue) ? balanceDue : Math.max(0, grandTotal - netPaid),
    },
  };
};

const MyBookingsPage = () => {
  const { page, limit, setPage, setLimit } = usePaginationQuery(1, DEFAULT_PAGE_SIZE);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: DEFAULT_PAGE_SIZE });
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetBookingId, setCancelTargetBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);

    try {
      const res = await bookingService.myBookings({
        page,
        limit,
        status: statusFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      const bookingList = Array.isArray(res?.data?.bookings)
        ? res.data.bookings
        : Array.isArray(res?.data)
          ? res.data
          : [];
      const normalized = bookingList.map(normalizeBooking);
      setBookings(normalized);

      const apiPagination = res?.data?.pagination || {};
      setPagination({
        page: Number(apiPagination.page || page || 1),
        totalPages: Number(apiPagination.totalPages || 1),
        total: Number(apiPagination.total || normalized.length),
        limit: Number(apiPagination.limit || limit),
      });
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  useEffect(() => {
    setExpandedBookingId(null);
  }, [statusFilter, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [statusFilter, fromDate, toDate, page, limit]);

  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [bookings],
  );

  const summary = useMemo(() => {
    return sortedBookings.reduce(
      (result, booking) => {
        result.total += 1;
        result.totalValue += Number(booking.invoice?.grand_total || 0);
        result.unpaidValue += Number(booking.payment_summary?.balance_due || 0);
        if (booking.status === 'Pending') result.pending += 1;
        if (booking.status === 'Completed') result.completed += 1;
        if (booking.status === 'Cancelled') result.cancelled += 1;
        return result;
      },
      { total: 0, pending: 0, completed: 0, cancelled: 0, totalValue: 0, unpaidValue: 0 },
    );
  }, [sortedBookings]);

  const openCancelModal = (id) => {
    setCancelTargetBookingId(id);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setCancelTargetBookingId(null);
    setCancelReason('');
  };

  const handleCancel = async (event) => {
    event.preventDefault();
    if (!cancelTargetBookingId) return;

    const reason = cancelReason.trim();
    if (!reason) {
      toast.error('Vui lòng nhập lý do hủy đặt phòng');
      return;
    }

    setCancelSubmitting(true);
    try {
      await bookingService.cancel(cancelTargetBookingId, { cancel_reason: reason });
      toast.success('Đã hủy đặt phòng');
      closeCancelModal();
      load();
    } catch (err) { toast.error(err.message); }
    setCancelSubmitting(false);
  };

  const resetFilters = () => {
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-page__inner">
        <div className="my-bookings-page__heading">
          <h1 className="my-bookings-page__title">Đặt phòng của tôi</h1>
          <p className="my-bookings-page__subtitle">Theo dõi trạng thái, chi phí và lịch sử dịch vụ cho từng booking của bạn.</p>
        </div>

        <div className="my-bookings-page__summary-grid">
          <div className="history-kpi">
            <span className="history-kpi__label">Tổng đơn</span>
            <strong className="history-kpi__value">{summary.total}</strong>
          </div>
          <div className="history-kpi">
            <span className="history-kpi__label">Đang chờ</span>
            <strong className="history-kpi__value">{summary.pending}</strong>
          </div>
          <div className="history-kpi">
            <span className="history-kpi__label">Tổng chi phí</span>
            <strong className="history-kpi__value">{formatCurrency(summary.totalValue)}</strong>
          </div>
          <div className="history-kpi">
            <span className="history-kpi__label">Còn phải thanh toán</span>
            <strong className="history-kpi__value">{formatCurrency(summary.unpaidValue)}</strong>
          </div>
        </div>

        <div className="my-bookings-page__filters">
          <div className="my-bookings-page__status-tabs">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.value || 'all'}
                type="button"
                className={`status-tab ${statusFilter === item.value ? 'status-tab--active' : ''}`}
                onClick={() => {
                  setStatusFilter(item.value);
                  setPage(1);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="my-bookings-page__date-range">
            <label>
              <span><FaCalendarDays /> Từ ngày</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label>
              <span><FaCalendarDays /> Đến ngày</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                min={fromDate || undefined}
              />
            </label>
            <button type="button" className="my-bookings-page__reset" onClick={resetFilters}>Xóa lọc</button>
          </div>
        </div>

        {loading ? <Spinner text="Đang tải lịch sử đặt phòng..." /> : sortedBookings.length === 0 ? (
          <div className="my-bookings-page__empty">
            <div className="my-bookings-page__empty-icon"><FaClipboardList color="#64748b" /></div>
            <p>Chưa có booking phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <>
          <div className="my-bookings-page__list">
            {sortedBookings.map((b) => (
              <div key={b.id} className="booking-item">
                <div className="booking-item__header">
                  <div>
                    <p className="booking-item__id">Mã đặt phòng: <strong>#{b.id}</strong></p>
                    <p className="booking-item__room">Phòng {b.Room?.room_number} — {b.Room?.RoomType?.type_name}</p>
                    <p className="booking-item__created-at">Tạo lúc: {formatDateTime(b.created_at)}</p>
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

                <div className="booking-item__money-line">
                  <div className="booking-item__money-tag">
                    <FaMoneyCheckDollar /> Đã thanh toán: <strong>{formatCurrency(b.payment_summary?.net_paid || 0)}</strong>
                  </div>
                  <div className="booking-item__money-tag booking-item__money-tag--warn">
                    Còn lại: <strong>{formatCurrency(b.payment_summary?.balance_due || 0)}</strong>
                  </div>
                </div>

                {b.status === 'Cancelled' && b.cancel_reason && (
                  <p className="booking-item__cancel-reason"><FaBan color="#b91c1c" /> Lý do hủy: {b.cancel_reason}</p>
                )}
                {b.special_request && (
                  <p className="booking-item__request"><FaCommentDots color="#64748b" /> {b.special_request}</p>
                )}

                {expandedBookingId === b.id && (
                  <div className="booking-item__detail">
                    <div className="booking-item__detail-grid">
                      <div className="booking-item__detail-cell"><span>Số đêm</span><strong>{b.invoice?.nights || calcNights(b.check_in_date, b.check_out_date)} đêm</strong></div>
                      <div className="booking-item__detail-cell"><span>Tiền phòng</span><strong>{formatCurrency(b.invoice?.room_total || 0)}</strong></div>
                      <div className="booking-item__detail-cell"><span>Tiền dịch vụ</span><strong>{formatCurrency(b.invoice?.service_total || 0)}</strong></div>
                      <div className="booking-item__detail-cell"><span>Tổng tiền</span><strong>{formatCurrency(b.invoice?.grand_total || 0)}</strong></div>
                    </div>

                    {Array.isArray(b.details) && b.details.length > 0 && (
                      <div className="booking-item__detail-list">
                        <p className="booking-item__detail-title">Dịch vụ đã dùng</p>
                        {b.details.map((detail) => (
                          <div key={detail.detail_id || `${detail.service_id}-${detail.used_at}`} className="booking-item__detail-row">
                            <span>{detail.service?.service_name || 'Dịch vụ'} x {detail.quantity || 0}</span>
                            <strong>{formatCurrency(detail.total_price || 0)}</strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {Array.isArray(b.payments) && b.payments.length > 0 && (
                      <div className="booking-item__detail-list">
                        <p className="booking-item__detail-title">Lịch sử thanh toán</p>
                        {b.payments.map((payment) => (
                          <div key={payment.payment_id || `${payment.created_at}-${payment.amount}`} className="booking-item__detail-row">
                            <span>{payment.payment_type} · {payment.payment_method} · {payment.payment_status}</span>
                            <strong>{formatCurrency(payment.amount || 0)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="booking-item__actions">
                  <button
                    type="button"
                    className="booking-item__toggle-btn"
                    onClick={() => setExpandedBookingId((prev) => (prev === b.id ? null : b.id))}
                  >
                    {expandedBookingId === b.id ? <><FaChevronUp /> Ẩn chi tiết</> : <><FaChevronDown /> Xem chi tiết</>}
                  </button>

                  {b.status === 'Pending' && (
                    <button className="booking-item__cancel-btn" onClick={() => openCancelModal(b.id)}>Hủy đặt phòng</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="my-bookings-page__bottom">
            <span className="my-bookings-page__pagination-note">Hiển thị {sortedBookings.length} / {pagination.total} booking</span>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
              limitOptions={[6, 12, 24, 48]}
            />
          </div>
          </>
        )}

        <Modal
          isOpen={cancelModalOpen}
          onClose={closeCancelModal}
          title={`Hủy đặt phòng #${cancelTargetBookingId || ''}`}
          size="sm"
          footer={(
            <>
              <Button variant="secondary" onClick={closeCancelModal}>Đóng</Button>
              <Button variant="danger" loading={cancelSubmitting} onClick={handleCancel}>Xác nhận hủy</Button>
            </>
          )}
        >
          <form onSubmit={handleCancel} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Lý do hủy *
            </label>
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={4}
              required
              placeholder="Nhập lý do hủy để khách sạn hỗ trợ tốt hơn"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                resize: 'vertical',
                fontFamily: 'var(--font-body)',
              }}
            />
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default MyBookingsPage;
