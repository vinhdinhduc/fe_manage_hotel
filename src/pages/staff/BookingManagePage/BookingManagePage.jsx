import { useState, useEffect } from 'react';
import { FaCirclePlus, FaClipboardList } from 'react-icons/fa6';
import bookingService from '../../../services/booking.service';
import serviceService from '../../../services/service.service';
import Table from '../../../components/common/Table/Table';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Input from '../../../components/common/Input/Input';
import PageHeader from '../../../components/common/PageHeader';
import { BookingStatusBadge } from '../../../components/common/StatusBadge';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { BANK_TRANSFER_INFO, PAYMENT_METHODS } from '../../../utils/constants';
import useToast from '../../../hooks/useToast';
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
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceQrUrl, setInvoiceQrUrl] = useState('');
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState({ payment_method: 'Cash', note: '' });
  const [addServiceForm, setAddServiceForm] = useState({ service_id: '', quantity: 1, note: '' });
  const [actLoading, setActLoading] = useState(false);

  const transferInfo = {
    bankName: invoiceData?.checkout_transfer?.bankName || BANK_TRANSFER_INFO.bankName,
    bankCode: invoiceData?.checkout_transfer?.bankCode || BANK_TRANSFER_INFO.bankCode,
    accountNumber: invoiceData?.checkout_transfer?.accountNumber || BANK_TRANSFER_INFO.accountNumber,
    accountName: invoiceData?.checkout_transfer?.accountName || BANK_TRANSFER_INFO.accountName,
    note: invoiceData?.checkout_transfer?.note || `${BANK_TRANSFER_INFO.transferPrefix} ${selected?.id || ''}`.trim(),
    amount: Number(invoiceData?.checkout_transfer?.amount || invoiceData?.invoice?.grand_total || 0),
  };

  const isActiveService = (service) => service?.is_active ?? service?.is_available ?? true;

  const load = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await bookingService.getAll(params);
      const bookingList = Array.isArray(res?.data) ? res.data : [];
      setBookings(bookingList.map(normalizeBooking));
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  useEffect(() => {
    serviceService.getAll()
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

  const handleAction = async (action, booking) => {
    setActLoading(true);
    try {
      if (action === 'confirm') await bookingService.confirm(booking.id);
      if (action === 'checkin') await bookingService.checkIn(booking.id);
      if (action === 'cancel') { if (!window.confirm('Hủy đặt phòng này?')) { setActLoading(false); return; } await bookingService.cancel(booking.id); }
      toast.success('Thao tác thành công');
      load();
    } catch (err) { toast.error(err.message); }
    setActLoading(false);
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
      load();
    } catch (err) { toast.error(err.message); }
    setActLoading(false);
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
        <Button size="sm" variant="secondary" onClick={() => { setSelected(row); setDetailOpen(true); }}>Chi tiết</Button>
        {row.status === 'Pending' && <Button size="sm" variant="primary" loading={actLoading} onClick={() => handleAction('confirm', row)}>Xác nhận</Button>}
        {row.status === 'Confirmed' && <Button size="sm" variant="success" loading={actLoading} onClick={() => handleAction('checkin', row)}>Check-in</Button>}
        {row.status === 'Checked-in' && <>
          <Button size="sm" variant="accent" icon={<FaCirclePlus />} onClick={() => { setSelected(row); setAddServiceOpen(true); }}>Thêm DV</Button>
          <Button size="sm" variant="primary" onClick={() => openCheckoutInvoice(row)}>Check-out</Button>
        </>}
        {['Pending','Confirmed'].includes(row.status) && <Button size="sm" variant="danger" loading={actLoading} onClick={() => handleAction('cancel', row)}>Hủy</Button>}
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
          <button key={s} className={`bm-filter-btn ${filterStatus === s ? 'bm-filter-btn--active' : ''}`} onClick={() => setFilterStatus(s)}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <Table columns={columns} data={bookings} loading={loading} emptyText="Không có đặt phòng nào" />

      {/* ── Detail Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Chi tiết đặt phòng #${selected?.id}`}
        size="md"
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
        {selected && (
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