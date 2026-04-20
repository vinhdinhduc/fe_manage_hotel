import { useState, useEffect } from 'react';
import { FaCirclePlus, FaClipboardList } from 'react-icons/fa6';
import bookingService from '../../../services/booking.service';
import bookingDetailService from '../../../services/bookingDetail.service';
import paymentService from '../../../services/payment.service';
import serviceService from '../../../services/service.service';
import Table from '../../../components/common/Table/Table';
import Pagination from '../../../components/common/Pagination/Pagination';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Input from '../../../components/common/Input/Input';
import PageHeader from '../../../components/common/PageHeader';
import { BookingStatusBadge } from '../../../components/common/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { BANK_TRANSFER_INFO, PAYMENT_METHODS } from '../../../utils/constants';
import useToast from '../../../hooks/useToast';
import usePaginationQuery from '../../../hooks/usePaginationQuery';
import './BookingManagePage.css';

const getNightCount = (checkInDate, checkOutDate) => {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const normalizeBooking = (booking = {}) => {
  const room = booking.room || booking.Room || null;
  const roomType = room?.roomType || room?.RoomType || null;
  const customer = booking.customer || booking.User || booking.user || null;
  const paymentTotal = Array.isArray(booking.payments)
    ? booking.payments.reduce((sum, payment) => sum + (Number(payment?.amount) || 0), 0)
    : 0;
  const serviceTotal = Array.isArray(booking.details)
    ? booking.details.reduce((sum, detail) => sum + (Number(detail?.total_price) || 0), 0)
    : 0;
  const roomBasePrice = Number(roomType?.base_price) || 0;
  const roomTotal = roomBasePrice * getNightCount(booking.check_in_date, booking.check_out_date);
  const fallbackTotal = paymentTotal > 0 ? paymentTotal : roomTotal + serviceTotal;

  return {
    ...booking,
    id: booking.id ?? booking.booking_id ?? null,
    User: customer
      ? {
          ...customer,
          full_name: customer.full_name || customer.name || '',
          email: customer.email || '',
        }
      : null,
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
    total_amount:
      booking.total_amount ??
      booking.totalAmount ??
      fallbackTotal,
  };
};

const BookingManagePage = () => {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const { page, limit, setPage, setLimit } = usePaginationQuery(1, 10);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceQrUrl, setInvoiceQrUrl] = useState('');
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState({ payment_method: 'Cash', note: '' });
  const [addServiceForm, setAddServiceForm] = useState({ service_id: '', quantity: 1, note: '' });
  const [depositForm, setDepositForm] = useState({ amount: '', payment_method: 'Cash', note: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [serviceDeleteLoadingId, setServiceDeleteLoadingId] = useState(null);
  const [actLoading, setActLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetBooking, setCancelTargetBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [rowActionLoading, setRowActionLoading] = useState({ bookingId: null, action: null });

  const transferInfo = {
    bankName: invoiceData?.checkout_transfer?.bankName || BANK_TRANSFER_INFO.bankName,
    bankCode: invoiceData?.checkout_transfer?.bankCode || BANK_TRANSFER_INFO.bankCode,
    accountNumber: invoiceData?.checkout_transfer?.accountNumber || BANK_TRANSFER_INFO.accountNumber,
    accountName: invoiceData?.checkout_transfer?.accountName || BANK_TRANSFER_INFO.accountName,
    note: invoiceData?.checkout_transfer?.note || `${BANK_TRANSFER_INFO.transferPrefix} ${selected?.id || ''}`.trim(),
    amount: Number(invoiceData?.checkout_transfer?.amount || invoiceData?.invoice?.grand_total || 0),
  };

  const isActiveService = (service) => service?.is_active ?? service?.is_available ?? true;
  const getServiceDetailId = (detail) => detail?.detail_id ?? detail?.booking_detail_id ?? detail?.id ?? null;
  const getPaymentId = (payment) => payment?.payment_id ?? payment?.id ?? null;
  const canAddDeposit = ['Pending', 'Confirmed'].includes(selected?.status);

  const getPaidAmount = (payments = []) => payments.reduce((sum, payment) => {
    const amount = Number(payment?.amount) || 0;
    if (payment?.payment_type === 'Refund' && payment?.payment_status === 'Completed') return sum - amount;
    if (payment?.payment_status === 'Completed') return sum + amount;
    return sum;
  }, 0);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(filterStatus ? { status: filterStatus } : {}),
      };
      const res = await bookingService.getAll(params);
      const bookingList = Array.isArray(res?.data) ? res.data : [];
      setBookings(bookingList.map(normalizeBooking));
      const apiPagination = res?.pagination || {};
      setPagination({
        page: Number(apiPagination.page || page),
        totalPages: Number(apiPagination.totalPages || 1),
        total: Number(apiPagination.total || bookingList.length),
        limit: Number(apiPagination.limit || limit),
      });
    } catch (err) { toast.error(err.message); }
    if (!silent) setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus, page, limit]);

  useEffect(() => {
    serviceService.getAll({ page: 1, limit: 1000 })
      .then((response) => {
        const serviceList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.services)
            ? response.data.services
            : [];
        setServices(
          serviceList.map((service) => ({
            ...service,
            id: service.id ?? service.service_id ?? null,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const refreshSelectedBooking = async (bookingId, { showLoading = true } = {}) => {
    if (!bookingId) return null;
    if (showLoading) setDetailLoading(true);
    try {
      const response = await bookingService.getById(bookingId);
      const detailedBooking = normalizeBooking(response?.data?.booking || {});
      const balanceDue = Math.max(0, Number(detailedBooking.total_amount || 0) - getPaidAmount(detailedBooking.payments));
      setSelected(detailedBooking);
      setDepositForm((prev) => ({
        ...prev,
        amount: balanceDue > 0 ? String(Math.round(balanceDue)) : '',
      }));
      return detailedBooking;
    } catch (err) {
      toast.error(err.message);
      return null;
    } finally {
      if (showLoading) setDetailLoading(false);
    }
  };

  const openDetail = async (booking) => {
    const normalizedBooking = normalizeBooking(booking);
    setSelected(normalizedBooking);
    setDepositForm({ amount: '', payment_method: 'Cash', note: '' });
    setDetailOpen(true);
    await refreshSelectedBooking(normalizedBooking.id);
  };

  const handleAction = async (action, booking) => {
    if (action === 'cancel') {
      setCancelTargetBooking(booking);
      setCancelReason('');
      setCancelModalOpen(true);
      return;
    }

    setRowActionLoading({ bookingId: booking.id, action });
    try {
      if (action === 'confirm') await bookingService.confirm(booking.id);
      if (action === 'checkin') await bookingService.checkIn(booking.id);
      toast.success('Thao tác thành công');
      await load({ silent: true });
    } catch (err) { toast.error(err.message); }
    setRowActionLoading({ bookingId: null, action: null });
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setCancelTargetBooking(null);
    setCancelReason('');
  };

  const handleSubmitCancel = async (event) => {
    event.preventDefault();
    if (!cancelTargetBooking?.id) return;

    const reason = cancelReason.trim();
    if (!reason) {
      toast.error('Vui lòng nhập lý do hủy đặt phòng');
      return;
    }

    setCancelSubmitting(true);
    try {
      await bookingService.cancel(cancelTargetBooking.id, { cancel_reason: reason });
      toast.success('Hủy đặt phòng thành công');
      closeCancelModal();
      await load({ silent: true });
    } catch (err) {
      toast.error(err.message);
    }
    setCancelSubmitting(false);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setActLoading(true);
    try {
      await bookingService.checkOut(selected.id, checkoutForm);
      toast.success('Check-out thành công');
      setCheckoutOpen(false);
      setInvoiceData(null);
      setInvoiceQrUrl('');
      await load();
    } catch (err) { toast.error(err.message); }
    setActLoading(false);
  };

  const handleCreateDeposit = async (event) => {
    event.preventDefault();
    if (!selected?.id) return;

    const amount = Number(depositForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Số tiền đặt cọc phải lớn hơn 0');
      return;
    }

    setPaymentLoading(true);
    try {
      await paymentService.deposit(selected.id, {
        amount,
        payment_method: depositForm.payment_method,
        note: depositForm.note || undefined,
      });
      toast.success('Ghi nhận đặt cọc thành công');
      setDepositForm((prev) => ({ ...prev, amount: '', note: '' }));
      await Promise.all([
        load(),
        refreshSelectedBooking(selected.id, { showLoading: false }),
      ]);
    } catch (err) {
      toast.error(err.message);
    }
    setPaymentLoading(false);
  };

  const handleRefund = async (payment) => {
    if (!isAdmin) return;

    const paymentId = getPaymentId(payment);
    if (!paymentId) {
      toast.error('Không xác định được giao dịch để hoàn tiền');
      return;
    }

    if (!window.confirm(`Hoàn tiền cho giao dịch #${paymentId}?`)) return;

    const note = window.prompt('Ghi chú hoàn tiền (không bắt buộc):', `Hoàn tiền cho giao dịch #${paymentId}`);
    if (note === null) return;

    setPaymentLoading(true);
    try {
      await paymentService.refund(paymentId, { note: note || undefined });
      toast.success('Hoàn tiền thành công');
      await Promise.all([
        load(),
        refreshSelectedBooking(selected?.id, { showLoading: false }),
      ]);
    } catch (err) {
      toast.error(err.message);
    }
    setPaymentLoading(false);
  };

  const handleRemoveService = async (detail) => {
    const detailId = getServiceDetailId(detail);
    if (!detailId) {
      toast.error('Không xác định được dịch vụ để xóa');
      return;
    }
    if (!window.confirm('Bạn có chắc muốn xóa dịch vụ này khỏi booking?')) return;

    setServiceDeleteLoadingId(detailId);
    try {
      await bookingDetailService.remove(detailId);
      toast.success('Đã xóa dịch vụ khỏi booking');
      await Promise.all([
        load(),
        refreshSelectedBooking(selected?.id, { showLoading: false }),
      ]);
    } catch (err) {
      toast.error(err.message);
    }
    setServiceDeleteLoadingId(null);
  };

  const handlePrintInvoice = () => {
    if (!selected || !invoiceData?.invoice) return;

    const invoice = invoiceData.invoice;
    const paymentMethodLabel = PAYMENT_METHODS.find((m) => m.value === checkoutForm.payment_method)?.label || checkoutForm.payment_method;
    const qrBlock = checkoutForm.payment_method === 'BankTransfer' && invoiceQrUrl
      ? `<div class="qr-wrap"><div class="qr-label">QR Chuyển khoản</div><img src="${invoiceQrUrl}" alt="QR chuyển khoản" /></div>`
      : '';

    const serviceRows = Array.isArray(selected.details)
      ? selected.details.map((detail) => `
        <tr>
          <td>${detail.service?.service_name || 'Dịch vụ'}</td>
          <td class="num">${detail.quantity || 0}</td>
          <td class="num">${formatCurrency(detail.unit_price || 0)}</td>
          <td class="num bold">${formatCurrency(detail.total_price || 0)}</td>
        </tr>`).join('')
      : '';

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      toast.error('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép pop-up.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn #${selected.id}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            :root {
              --gold: #9A7D3A;
              --gold-light: #C9A84C;
              --ink: #1C1C1E;
              --ink-2: #4A4A52;
              --ink-3: #8A8A94;
              --border: #E8E3D8;
              --border-light: #F0EDE6;
              --bg: #F9F7F3;
              --gold-bg: #FBF8F1;
            }
            body {
              font-family: 'DM Sans', system-ui, sans-serif;
              color: var(--ink);
              background: #fff;
              padding: 32px 28px;
              font-size: 14px;
              line-height: 1.5;
            }
            .invoice { max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

            /* Header */
            .inv-header {
              display: flex; justify-content: space-between; align-items: flex-end;
              padding-bottom: 14px; border-bottom: 2px solid var(--ink); gap: 12px;
            }
            .inv-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; line-height: 1; }
            .inv-tagline { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-top: 4px; }
            .inv-meta { text-align: right; }
            .inv-meta .inv-id { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 600; }
            .inv-meta .inv-date { font-size: 11px; color: var(--ink-3); margin-top: 3px; }

            /* Section card */
            .card { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin: 0; }
            .card-head { padding: 8px 14px; background: var(--bg); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 7px; }
            .card-head-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }
            .card-head-text { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-2); }
            .card-body { padding: 10px 14px; }

            /* Rows */
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-light); font-size: 13px; gap: 12px; }
            .row:last-child { border-bottom: none; }
            .row .lbl { color: var(--ink-3); }
            .row .val { font-weight: 500; text-align: right; }

            /* 2-col grid */
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }

            /* Pricing */
            .divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: 6px 0; }
            .row-total { padding: 10px 0 4px; border-bottom: none !important; }
            .row-total .lbl { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 600; }
            .row-total .val { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: var(--gold); }

            /* Services table */
            table { width: 100%; border-collapse: collapse; }
            thead tr { border-bottom: 1.5px solid var(--border); }
            th { padding: 6px 0 8px; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-3); text-align: left; }
            td { padding: 7px 0; font-size: 13px; border-bottom: 1px solid var(--border-light); }
            tbody tr:last-child td { border-bottom: none; }
            .num { text-align: right; }
            .bold { font-weight: 600; }

            /* Bank transfer */
            .bank-card { background: #FBF8F1; border: 1px solid #E8D99A; border-radius: 10px; overflow: hidden; }
            .bank-head { padding: 8px 14px; border-bottom: 1px dashed #E8D99A; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); }

            /* QR */
            .qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; border-top: 1px dashed #E8D99A; }
            .qr-label { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); }
            .qr-wrap img { width: 200px; height: 200px; object-fit: contain; border-radius: 8px; border: 1px solid #E8D99A; padding: 4px; background: #fff; }

            /* Stamp */
            .stamp { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
            .stamp-line { flex: 1; height: 1px; background: var(--border); }
            .stamp-text { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-3); white-space: nowrap; }

            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>
          <div class="invoice">
            <!-- Header -->
            <div class="inv-header">
              <div>
                <div class="inv-title">Hóa đơn</div>
                <div class="inv-tagline">Hotel Management System</div>
              </div>
              <div class="inv-meta">
                <div class="inv-id">#HD-${selected.id}</div>
                <div class="inv-date">Đặt phòng #${selected.id}</div>
                <div class="inv-date">${formatDateTime(new Date())}</div>
              </div>
            </div>

            <!-- Guest & Room Info -->
            <div class="card">
              <div class="card-head"><div class="card-head-dot"></div><span class="card-head-text">Thông tin đặt phòng</span></div>
              <div class="card-body grid2">
                <div class="row"><span class="lbl">Khách hàng</span><strong class="val">${selected.User?.full_name || '—'}</strong></div>
                <div class="row"><span class="lbl">Email</span><span class="val">${selected.User?.email || '—'}</span></div>
                <div class="row"><span class="lbl">Phòng</span><strong class="val">${selected.Room ? `Phòng ${selected.Room.room_number}` : '—'}</strong></div>
                <div class="row"><span class="lbl">Loại phòng</span><span class="val">${selected.Room?.RoomType?.type_name || '—'}</span></div>
                <div class="row"><span class="lbl">Nhận phòng</span><span class="val">${formatDate(selected.check_in_date)}</span></div>
                <div class="row"><span class="lbl">Trả phòng</span><span class="val">${formatDate(selected.check_out_date)}</span></div>
                <div class="row"><span class="lbl">Số đêm</span><strong class="val">${invoice.nights} đêm</strong></div>
                <div class="row"><span class="lbl">Số khách</span><span class="val">${selected.adults || 0} NL${selected.children > 0 ? `, ${selected.children} TE` : ''}</span></div>
                <div class="row"><span class="lbl">Phương thức</span><span class="val">${paymentMethodLabel}</span></div>
                <div class="row"><span class="lbl">Ghi chú</span><span class="val">${checkoutForm.note || '—'}</span></div>
              </div>
            </div>

            <!-- Pricing -->
            <div class="card">
              <div class="card-head"><div class="card-head-dot"></div><span class="card-head-text">Chi phí</span></div>
              <div class="card-body">
                <div class="row"><span class="lbl">Tiền phòng</span><span class="val">${formatCurrency(invoice.room_total)}</span></div>
                <div class="row"><span class="lbl">Dịch vụ bổ sung</span><span class="val">${formatCurrency(invoice.service_total)}</span></div>
                <div class="divider"></div>
                <div class="row row-total"><span class="lbl">Tổng thanh toán</span><strong class="val">${formatCurrency(invoice.grand_total)}</strong></div>
              </div>
            </div>

            ${selected.details?.length ? `
            <!-- Services -->
            <div class="card">
              <div class="card-head"><div class="card-head-dot"></div><span class="card-head-text">Chi tiết dịch vụ</span></div>
              <div class="card-body">
                <table>
                  <thead><tr><th>Dịch vụ</th><th class="num">SL</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th></tr></thead>
                  <tbody>${serviceRows}</tbody>
                </table>
              </div>
            </div>` : ''}

            ${checkoutForm.payment_method === 'BankTransfer' ? `
            <!-- Bank Transfer -->
            <div class="bank-card">
              <div class="bank-head">🏦 Thông tin chuyển khoản</div>
              <div class="card-body">
                <div class="row"><span class="lbl">Ngân hàng</span><strong class="val">${transferInfo.bankName}</strong></div>
                <div class="row"><span class="lbl">Số tài khoản</span><strong class="val">${transferInfo.accountNumber}</strong></div>
                <div class="row"><span class="lbl">Chủ tài khoản</span><span class="val">${transferInfo.accountName}</span></div>
                <div class="row"><span class="lbl">Nội dung CK</span><strong class="val">${transferInfo.note}</strong></div>
                <div class="row"><span class="lbl">Số tiền</span><strong class="val">${formatCurrency(transferInfo.amount)}</strong></div>
              </div>
              ${qrBlock}
            </div>` : ''}

            <!-- Footer -->
            <div class="stamp">
              <div class="stamp-line"></div>
              <span class="stamp-text">Cảm ơn quý khách · In từ hệ thống quản lý khách sạn · ${formatDateTime(new Date())}</span>
              <div class="stamp-line"></div>
            </div>
          </div>
          <script>window.onload = function(){ window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const openCheckoutInvoice = async (booking) => {
    setSelected(booking);
    setCheckoutForm({ payment_method: 'Cash', note: '' });
    setInvoiceData(null);
    setInvoiceQrUrl('');
    setCheckoutOpen(true);
    setInvoiceLoading(true);
    try {
      const res = await bookingService.getInvoice(booking.id);
      const detailedBooking = normalizeBooking(res?.data?.booking || booking);
      setSelected(detailedBooking);
      setInvoiceData({
        booking: detailedBooking,
        invoice: res?.data?.invoice || null,
        checkout_transfer: res?.data?.checkout_transfer || null,
      });
      setInvoiceQrUrl(res?.data?.checkout_qr || '');
    } catch (err) {
      toast.error(err.message);
      setCheckoutOpen(false);
    }
    setInvoiceLoading(false);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!addServiceForm.service_id) { toast.error('Chọn dịch vụ'); return; }
    setActLoading(true);
    try {
      await bookingService.addService(selected.id, {
        ...addServiceForm,
        service_id: Number(addServiceForm.service_id),
        quantity: Number(addServiceForm.quantity) || 1,
      });
      toast.success('Thêm dịch vụ thành công');
      setAddServiceOpen(false);
      setAddServiceForm({ service_id: '', quantity: 1, note: '' });
      await Promise.all([
        load(),
        refreshSelectedBooking(selected?.id, { showLoading: false }),
      ]);
    } catch (err) { toast.error(err.message); }
    setActLoading(false);
  };

  const STATUSES = ['', 'Pending', 'Confirmed', 'Checked-in', 'Completed', 'Cancelled'];
  const STATUS_LABELS = { '': 'Tất cả', Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', 'Checked-in': 'Đang lưu trú', Completed: 'Hoàn thành', Cancelled: 'Đã hủy' };

  const columns = [
    { key: 'id', title: 'Mã', width: 60, render: (v) => `#${v}` },
    { key: 'user', title: 'Khách hàng', render: (_, r) => r.User?.full_name || '—' },
    { key: 'room', title: 'Phòng', render: (_, r) => r.Room ? `Phòng ${r.Room.room_number}` : '—' },
    { key: 'check_in_date', title: 'Nhận phòng', render: (v) => formatDate(v) },
    { key: 'check_out_date', title: 'Trả phòng', render: (v) => formatDate(v) },
    { key: 'status', title: 'Trạng thái', render: (v) => <BookingStatusBadge status={v} /> },
    { key: 'total_amount', title: 'Tổng tiền', render: (v) => Number(v) > 0 ? formatCurrency(v) : '—' },
    { key: 'actions', title: 'Hành động', render: (_, row) => (
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <Button size="sm" variant="secondary" onClick={() => openDetail(row)}>Chi tiết</Button>
        {row.status === 'Pending' && <Button size="sm" variant="primary" loading={rowActionLoading.bookingId === row.id && rowActionLoading.action === 'confirm'} onClick={() => handleAction('confirm', row)}>Xác nhận</Button>}
        {row.status === 'Confirmed' && <Button size="sm" variant="success" loading={rowActionLoading.bookingId === row.id && rowActionLoading.action === 'checkin'} onClick={() => handleAction('checkin', row)}>Check-in</Button>}
        {row.status === 'Checked-in' && <>
          <Button size="sm" variant="accent" icon={<FaCirclePlus />} onClick={() => { setSelected(row); setAddServiceOpen(true); }}>Thêm DV</Button>
          <Button size="sm" variant="primary" onClick={() => openCheckoutInvoice(row)}>Check-out</Button>
        </>}
        {['Pending','Confirmed'].includes(row.status) && <Button size="sm" variant="danger" onClick={() => handleAction('cancel', row)}>Hủy</Button>}
      </div>
    )},
  ];

  return (
    <div className="booking-manage-page">
      <PageHeader
        title="Quản lý đặt phòng"
        subtitle="Xem, xác nhận và xử lý các đặt phòng"
        icon={<FaClipboardList size={18} />}
      />

      <div className="booking-manage-page__filters">
        {STATUSES.map(s => (
          <button key={s} className={`bm-filter-btn ${filterStatus === s ? 'bm-filter-btn--active' : ''}`} onClick={() => { setFilterStatus(s); setPage(1); }}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <Table columns={columns} data={bookings} loading={loading} emptyText="Không có đặt phòng nào" />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <Modal
        isOpen={cancelModalOpen}
        onClose={closeCancelModal}
        title={`Hủy đặt phòng #${cancelTargetBooking?.id || ''}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeCancelModal}>Đóng</Button>
            <Button variant="danger" loading={cancelSubmitting} onClick={handleSubmitCancel}>Xác nhận hủy</Button>
          </>
        }
      >
        <form onSubmit={handleSubmitCancel} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Lý do hủy *
          </label>
          <textarea
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            rows={4}
            required
            placeholder="Nhập lý do hủy để gửi thông báo cho khách hàng"
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

      {/* ── Detail Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Chi tiết đặt phòng #${selected?.id}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailOpen(false)}>Đóng</Button>
            {selected?.status === 'Checked-in' && (
              <Button variant="primary" onClick={() => { setDetailOpen(false); openCheckoutInvoice(selected); }}>
                Xem hóa đơn
              </Button>
            )}
          </>
        }
      >
        {detailLoading ? (
          <div className="inv-loading">
            <div className="inv-loading__spinner" />
            <span className="inv-loading__text">Đang tải chi tiết booking...</span>
          </div>
        ) : selected && (
          <div className="booking-detail">
            <div className="booking-detail__row"><span>Khách hàng</span><strong>{selected.User?.full_name}</strong></div>
            <div className="booking-detail__row"><span>Email</span><strong>{selected.User?.email}</strong></div>
            <div className="booking-detail__row"><span>Phòng</span><strong>Phòng {selected.Room?.room_number} — {selected.Room?.RoomType?.type_name}</strong></div>
            <div className="booking-detail__row"><span>Nhận phòng</span><strong>{formatDate(selected.check_in_date)}</strong></div>
            <div className="booking-detail__row"><span>Trả phòng</span><strong>{formatDate(selected.check_out_date)}</strong></div>
            <div className="booking-detail__row"><span>Số khách</span><strong>{selected.adults} NL{selected.children > 0 ? `, ${selected.children} TE` : ''}</strong></div>
            <div className="booking-detail__row"><span>Trạng thái</span><BookingStatusBadge status={selected.status} /></div>
            {selected.special_request && <div className="booking-detail__row"><span>Yêu cầu</span><strong>{selected.special_request}</strong></div>}
            {selected.total_amount > 0 && (
              <div className="booking-detail__row booking-detail__row--total">
                <span>Tổng tiền</span><strong>{formatCurrency(selected.total_amount)}</strong>
              </div>
            )}

            <div className="booking-detail__row booking-detail__row--summary">
              <span>Đã thanh toán (ròng)</span>
              <strong>{formatCurrency(getPaidAmount(selected.payments))}</strong>
            </div>
            <div className="booking-detail__row booking-detail__row--summary">
              <span>Còn phải thu</span>
              <strong>{formatCurrency(Math.max(0, Number(selected.total_amount || 0) - getPaidAmount(selected.payments)))}</strong>
            </div>

            <section className="booking-detail__section">
              <div className="booking-detail__section-header">
                <h4>Dịch vụ đã thêm</h4>
                <span>{Array.isArray(selected.details) ? selected.details.length : 0} mục</span>
              </div>

              {Array.isArray(selected.details) && selected.details.length > 0 ? (
                <div className="booking-detail__list">
                  {selected.details.map((detail) => {
                    const detailId = getServiceDetailId(detail);
                    const canRemoveService = selected.status === 'Checked-in' && !!detailId;

                    return (
                      <div key={detailId || `${detail.service_id}-${detail.used_at || ''}`} className="booking-detail__list-item">
                        <div>
                          <p className="booking-detail__list-title">{detail.service?.service_name || 'Dịch vụ'}</p>
                          <p className="booking-detail__list-sub">SL: {detail.quantity || 0} · Đơn giá: {formatCurrency(detail.unit_price || 0)}</p>
                        </div>
                        <div className="booking-detail__list-actions">
                          <strong>{formatCurrency(detail.total_price || 0)}</strong>
                          {canRemoveService && (
                            <Button
                              size="sm"
                              variant="danger"
                              loading={serviceDeleteLoadingId === detailId}
                              onClick={() => handleRemoveService(detail)}
                            >
                              Xóa
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="booking-detail__empty">Chưa có dịch vụ bổ sung.</p>
              )}
            </section>

            <section className="booking-detail__section">
              <div className="booking-detail__section-header">
                <h4>Lịch sử thanh toán</h4>
                <span>{Array.isArray(selected.payments) ? selected.payments.length : 0} giao dịch</span>
              </div>

              {Array.isArray(selected.payments) && selected.payments.length > 0 ? (
                <div className="booking-detail__list">
                  {selected.payments.map((payment) => {
                    const paymentId = getPaymentId(payment);
                    const canRefund = isAdmin && payment.payment_status === 'Completed' && payment.payment_type !== 'Refund';

                    return (
                      <div key={paymentId || `${payment.payment_type}-${payment.created_at || ''}`} className="booking-detail__list-item">
                        <div>
                          <p className="booking-detail__list-title">#{paymentId || '—'} · {payment.payment_type}</p>
                          <p className="booking-detail__list-sub">
                            {payment.payment_method} · {payment.payment_status}
                            {payment.paid_at ? ` · ${formatDateTime(payment.paid_at)}` : ''}
                          </p>
                        </div>
                        <div className="booking-detail__list-actions">
                          <strong>{formatCurrency(payment.amount || 0)}</strong>
                          {canRefund && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={paymentLoading}
                              onClick={() => handleRefund(payment)}
                            >
                              Hoàn tiền
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="booking-detail__empty">Chưa có giao dịch thanh toán.</p>
              )}
            </section>

            {canAddDeposit && (
              <section className="booking-detail__section">
                <div className="booking-detail__section-header">
                  <h4>Ghi nhận đặt cọc</h4>
                  <span>Cho booking chờ xác nhận/đã xác nhận</span>
                </div>

                <form className="booking-detail__deposit-form" onSubmit={handleCreateDeposit}>
                  <div className="booking-detail__deposit-grid">
                    <Input
                      label="Số tiền đặt cọc"
                      name="deposit_amount"
                      type="number"
                      min="1"
                      value={depositForm.amount}
                      onChange={(event) => setDepositForm((prev) => ({ ...prev, amount: event.target.value }))}
                      required
                    />

                    <div>
                      <label className="booking-detail__field-label">Phương thức</label>
                      <select
                        className="booking-detail__field-select"
                        value={depositForm.payment_method}
                        onChange={(event) => setDepositForm((prev) => ({ ...prev, payment_method: event.target.value }))}
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method.value} value={method.value}>{method.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Ghi chú"
                    name="deposit_note"
                    value={depositForm.note}
                    onChange={(event) => setDepositForm((prev) => ({ ...prev, note: event.target.value }))}
                    placeholder="Ví dụ: Khách đặt cọc giữ phòng"
                  />

                  <div className="booking-detail__deposit-actions">
                    <Button type="submit" variant="primary" loading={paymentLoading}>Ghi nhận đặt cọc</Button>
                  </div>
                </form>
              </section>
            )}
          </div>
        )}
      </Modal>

      {/* ── Checkout / Invoice Modal ───────────────────────────── */}
      <Modal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Xác nhận hóa đơn"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCheckoutOpen(false); setInvoiceData(null); setInvoiceQrUrl(''); }}>Hủy</Button>
            <Button variant="secondary" onClick={handlePrintInvoice} disabled={!invoiceData?.invoice}>In hóa đơn</Button>
            <Button variant="primary" loading={actLoading || invoiceLoading} onClick={handleCheckout}>Xác nhận thanh toán & hoàn tất</Button>
          </>
        }
      >
        {invoiceLoading ? (
          <div className="inv-loading">
            <div className="inv-loading__spinner" />
            <span className="inv-loading__text">Đang tải hóa đơn...</span>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="inv-root">

            {/* ── Header ── */}
            <div className="inv-header">
              <div className="inv-header__brand">
                <div className="inv-header__title">Hóa đơn</div>
                <div className="inv-header__subtitle">Hotel Management System</div>
              </div>
              <div className="inv-header__meta">
                <div className="inv-header__id">#HD-{selected?.id}</div>
                <div className="inv-header__date">Đặt phòng #{selected?.id}</div>
                <div className="inv-header__date">{formatDateTime(new Date())}</div>
              </div>
            </div>

            {/* ── Thông tin đặt phòng ── */}
            <div className="inv-card">
              <div className="inv-card__head">
                <div className="inv-card__head-dot" />
                <span className="inv-card__head-label">Thông tin đặt phòng</span>
              </div>
              <div className="inv-card__body inv-grid-2">
                <div className="inv-row"><span className="inv-row__label">Khách hàng</span><strong className="inv-row__value">{selected?.User?.full_name || '—'}</strong></div>
                <div className="inv-row"><span className="inv-row__label">Email</span><span className="inv-row__value">{selected?.User?.email || '—'}</span></div>
                <div className="inv-row"><span className="inv-row__label">Phòng</span><strong className="inv-row__value">{selected?.Room ? `Phòng ${selected.Room.room_number}` : '—'}</strong></div>
                <div className="inv-row"><span className="inv-row__label">Loại phòng</span><span className="inv-row__value">{selected?.Room?.RoomType?.type_name || '—'}</span></div>
                <div className="inv-row"><span className="inv-row__label">Nhận phòng</span><span className="inv-row__value">{formatDate(selected?.check_in_date)}</span></div>
                <div className="inv-row"><span className="inv-row__label">Trả phòng</span><span className="inv-row__value">{formatDate(selected?.check_out_date)}</span></div>
                <div className="inv-row"><span className="inv-row__label">Số đêm</span><strong className="inv-row__value">{invoiceData?.invoice?.nights || 0} đêm</strong></div>
                <div className="inv-row"><span className="inv-row__label">Số khách</span><span className="inv-row__value">{selected?.adults || 0} NL{selected?.children > 0 ? `, ${selected.children} TE` : ''}</span></div>
              </div>
            </div>

            {/* ── Chi phí ── */}
            <div className="inv-card">
              <div className="inv-card__head">
                <div className="inv-card__head-dot" />
                <span className="inv-card__head-label">Chi phí</span>
              </div>
              <div className="inv-card__body inv-pricing">
                <div className="inv-row">
                  <span className="inv-row__label">Tiền phòng</span>
                  <span className="inv-row__value">{formatCurrency(invoiceData?.invoice?.room_total || 0)}</span>
                </div>
                <div className="inv-row">
                  <span className="inv-row__label">Dịch vụ bổ sung</span>
                  <span className="inv-row__value">{formatCurrency(invoiceData?.invoice?.service_total || 0)}</span>
                </div>
                <div className="inv-divider" />
                <div className="inv-row inv-row--total">
                  <span className="inv-row__label">Tổng thanh toán</span>
                  <strong className="inv-row__value">{formatCurrency(invoiceData?.invoice?.grand_total || 0)}</strong>
                </div>
              </div>
            </div>

            {/* ── Chi tiết dịch vụ ── */}
            {Array.isArray(selected?.details) && selected.details.length > 0 && (
              <div className="inv-card">
                <div className="inv-card__head">
                  <div className="inv-card__head-dot" />
                  <span className="inv-card__head-label">Chi tiết dịch vụ</span>
                </div>
                <div className="inv-card__body">
                  <table className="inv-services-table">
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th style={{ textAlign: 'right' }}>SL</th>
                        <th style={{ textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.details.map((detail) => (
                        <tr key={detail.booking_detail_id || detail.id || `${detail.service_id}-${detail.note || ''}`}>
                          <td>{detail.service?.service_name || 'Dịch vụ'}</td>
                          <td style={{ textAlign: 'right' }}>{detail.quantity || 0}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(detail.unit_price || 0)}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(detail.total_price || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Phương thức thanh toán & ghi chú ── */}
            <div className="inv-card">
              <div className="inv-card__head">
                <div className="inv-card__head-dot" />
                <span className="inv-card__head-label">Thanh toán</span>
              </div>
              <div className="inv-card__body" style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="inv-payment-label">Phương thức thanh toán</label>
                  <select
                    className="inv-payment-select"
                    value={checkoutForm.payment_method}
                    onChange={e => setCheckoutForm(f => ({ ...f, payment_method: e.target.value }))}
                  >
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <Input
                  label="Ghi chú"
                  name="note"
                  value={checkoutForm.note}
                  onChange={e => setCheckoutForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Ghi chú thanh toán (tùy chọn)"
                />
              </div>
            </div>

            {/* ── Chuyển khoản ngân hàng ── */}
            {checkoutForm.payment_method === 'BankTransfer' && (
              <div className="inv-bank">
                <div className="inv-bank__header">
                  <span className="inv-bank__header-icon">🏦</span>
                  <span className="inv-bank__header-text">Thông tin chuyển khoản</span>
                </div>
                <div className="inv-bank__body">
                  <div className="inv-row"><span className="inv-row__label">Ngân hàng</span><strong className="inv-row__value">{transferInfo.bankName}</strong></div>
                  <div className="inv-row"><span className="inv-row__label">Số tài khoản</span><strong className="inv-row__value">{transferInfo.accountNumber}</strong></div>
                  <div className="inv-row"><span className="inv-row__label">Chủ tài khoản</span><span className="inv-row__value">{transferInfo.accountName}</span></div>
                  <div className="inv-row"><span className="inv-row__label">Nội dung CK</span><strong className="inv-row__value">{transferInfo.note}</strong></div>
                  <div className="inv-row"><span className="inv-row__label">Số tiền</span><strong className="inv-row__value" style={{ color: 'var(--inv-gold)' }}>{formatCurrency(transferInfo.amount)}</strong></div>
                </div>
                <div className="inv-bank__qr">
                  <span className="inv-bank__qr-label">QR Chuyển khoản</span>
                  {invoiceQrUrl ? (
                    <img src={invoiceQrUrl} alt="QR chuyển khoản" />
                  ) : (
                    <div className="inv-bank__qr-pending">
                      <div className="inv-bank__qr-pending-icon">⏳</div>
                      <span className="inv-bank__qr-pending-text">QR sẽ được tạo theo số tiền hóa đơn</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Footer stamp ── */}
            <div className="inv-stamp-row">
              <div className="inv-stamp-line" />
              <span className="inv-stamp-text">Cảm ơn quý khách · Hẹn gặp lại</span>
              <div className="inv-stamp-line" />
            </div>

          </form>
        )}
      </Modal>

      {/* ── Add Service Modal ──────────────────────────────────── */}
      <Modal
        isOpen={addServiceOpen}
        onClose={() => setAddServiceOpen(false)}
        title="Thêm dịch vụ"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddServiceOpen(false)}>Hủy</Button>
            <Button variant="primary" loading={actLoading} onClick={handleAddService}>Thêm dịch vụ</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Dịch vụ</label>
            <select value={addServiceForm.service_id} onChange={e => setAddServiceForm(f => ({ ...f, service_id: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginTop: 5, fontSize: '0.9rem' }}>
              <option value="">— Chọn dịch vụ —</option>
              {services.filter(isActiveService).map(s => <option key={s.id} value={s.id}>{s.service_name} — {formatCurrency(s.price)}</option>)}
            </select>
          </div>
          <Input label="Số lượng" name="quantity" type="number" value={addServiceForm.quantity} onChange={e => setAddServiceForm(f => ({ ...f, quantity: e.target.value }))} min="1" />
          <Input label="Ghi chú" name="note" value={addServiceForm.note} onChange={e => setAddServiceForm(f => ({ ...f, note: e.target.value }))} placeholder="Ghi chú dịch vụ (tùy chọn)" />
        </div>
      </Modal>
    </div>
  );
};

export default BookingManagePage;