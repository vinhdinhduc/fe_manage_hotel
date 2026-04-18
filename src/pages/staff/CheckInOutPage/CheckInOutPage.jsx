import { useState, useEffect } from 'react';
import { FaCircleCheck, FaKey, FaRightFromBracket } from 'react-icons/fa6';
import bookingService from '../../../services/booking.service';
import Table from '../../../components/common/Table/Table';
import Button from '../../../components/common/Button/Button';
import PageHeader from '../../../components/common/PageHeader';
import { BookingStatusBadge } from '../../../components/common/StatusBadge';
import { formatDate } from '../../../utils/formatters';
import useToast from '../../../hooks/useToast';
import './CheckInOutPage.css';

const CheckInOutPage = () => {
  const toast = useToast();
  const [tab, setTab] = useState('checkin');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const status = tab === 'checkin' ? 'Confirmed' : 'Checked-in';
      const res = await bookingService.getAll({ status });
      setBookings(res?.data || []);
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const handleCheckIn = async (id) => {
    setActLoading(true);
    try {
      await bookingService.checkIn(id);
      toast.success('Check-in thành công!');
      load();
    } catch (err) { toast.error(err.message); }
    setActLoading(false);
  };

  const handleCheckOut = async (id) => {
    const method = window.prompt('Phương thức thanh toán (Cash/BankTransfer):', 'Cash');
    if (!method) return;
    setActLoading(true);
    try {
      await bookingService.checkOut(id, { payment_method: method });
      toast.success('Check-out thành công!');
      load();
    } catch (err) { toast.error(err.message); }
    setActLoading(false);
  };

  const checkInColumns = [
    { key: 'id', title: 'Mã ĐP', render: v => `#${v}` },
    { key: 'User', title: 'Khách hàng', render: v => v?.full_name || '—' },
    { key: 'User', title: 'Liên hệ', render: v => v?.phone || '—' },
    { key: 'Room', title: 'Phòng', render: v => v ? `Phòng ${v.room_number} — Tầng ${v.floor}` : '—' },
    { key: 'check_in_date', title: 'Ngày nhận phòng', render: v => formatDate(v) },
    { key: 'check_out_date', title: 'Ngày trả phòng', render: v => formatDate(v) },
    { key: 'adults', title: 'Khách', render: (v, r) => `${v} NL${r.children > 0 ? `, ${r.children} TE` : ''}` },
    { key: 'actions', title: 'Hành động', render: (_, r) => (
      <Button size="sm" variant="success" loading={actLoading} onClick={() => handleCheckIn(r.id)} icon={<FaCircleCheck />}>Check-in</Button>
    )},
  ];

  const checkOutColumns = [
    { key: 'id', title: 'Mã ĐP', render: v => `#${v}` },
    { key: 'User', title: 'Khách hàng', render: v => v?.full_name || '—' },
    { key: 'Room', title: 'Phòng', render: v => v ? `Phòng ${v.room_number}` : '—' },
    { key: 'check_in_date', title: 'Nhận phòng', render: v => formatDate(v) },
    { key: 'check_out_date', title: 'Trả phòng', render: v => formatDate(v) },
    { key: 'status', title: 'Trạng thái', render: v => <BookingStatusBadge status={v} /> },
    { key: 'actions', title: 'Hành động', render: (_, r) => (
      <Button size="sm" variant="accent" loading={actLoading} onClick={() => handleCheckOut(r.id)} icon={<FaRightFromBracket />}>Check-out</Button>
    )},
  ];

  return (
    <div className="checkinout-page">
      <PageHeader title="Check-in / Check-out" subtitle="Xử lý nhận phòng và trả phòng cho khách" icon={<FaKey size={18} />} />
      <div className="checkinout-page__tabs">
        <button className={`cio-tab ${tab==='checkin'?'cio-tab--active':''}`} onClick={() => setTab('checkin')}>
          <FaCircleCheck style={{ color: '#2dbe6c' }} /> Chờ Check-in <span className="cio-tab__badge">{tab==='checkin'?bookings.length:''}</span>
        </button>
        <button className={`cio-tab ${tab==='checkout'?'cio-tab--active':''}`} onClick={() => setTab('checkout')}>
          <FaRightFromBracket style={{ color: '#f5a623' }} /> Chờ Check-out <span className="cio-tab__badge">{tab==='checkout'?bookings.length:''}</span>
        </button>
      </div>
      <Table columns={tab==='checkin'?checkInColumns:checkOutColumns} data={bookings} loading={loading}
        emptyText={tab==='checkin'?'Không có khách chờ check-in':'Không có khách chờ check-out'} />
    </div>
  );
};

export default CheckInOutPage;
