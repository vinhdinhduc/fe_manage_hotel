import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FaCircleInfo, FaHotel } from 'react-icons/fa6';
import bookingService from '../../../services/booking.service';
import roomService from '../../../services/room.service';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import Card from '../../../components/common/Card';
import Spinner from '../../../components/common/Spinner/Spinner';
import useToast from '../../../hooks/useToast';
import { formatCurrency, calcNights } from '../../../utils/formatters';
import './BookingPage.css';

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const toast = useToast();

  const { room: stateRoom, check_in_date, check_out_date, adults } = location.state || {};
  const [room, setRoom] = useState(stateRoom || null);
  const [loadingRoom, setLoadingRoom] = useState(!stateRoom);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    check_in_date: check_in_date || '',
    check_out_date: check_out_date || '',
    adults: adults || 1,
    children: 0,
    special_request: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let mounted = true;
    const loadRoom = async () => {
      if (stateRoom) {
        setRoom(stateRoom);
        setLoadingRoom(false);
        return;
      }

      setLoadingRoom(true);
      try {
        const response = await roomService.getById(id);
        if (!mounted) return;
        setRoom(response?.data?.room || null);
      } catch (err) {
        if (!mounted) return;
        toast.error(err.message || 'Không tải được thông tin phòng');
        setRoom(null);
      }
      if (mounted) setLoadingRoom(false);
    };

    loadRoom();
    return () => {
      mounted = false;
    };
  }, [id, stateRoom, toast]);

  const roomType = room?.roomType || room?.RoomType;

  const nights = calcNights(form.check_in_date, form.check_out_date);
  const pricePerNight = Number(roomType?.base_price ?? roomType?.price_per_night ?? 0);
  const totalAmount = pricePerNight * nights;

  const validate = () => {
    const e = {};
    if (!form.check_in_date) e.check_in_date = 'Vui lòng chọn ngày nhận phòng';
    if (!form.check_out_date) e.check_out_date = 'Vui lòng chọn ngày trả phòng';
    if (form.check_in_date >= form.check_out_date) e.check_out_date = 'Ngày trả phòng phải sau ngày nhận phòng';
    return e;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await bookingService.create({ room_id: room?.room_id || room?.id || parseInt(id), ...form });
      toast.success('Đặt phòng thành công! Vui lòng chờ xác nhận.');
      navigate('/my-bookings');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingRoom) return (
    <div className="booking-page__no-room">
      <Spinner text="Đang tải thông tin phòng..." />
    </div>
  );

  if (!room) return (
    <div className="booking-page__no-room">
      <p>Không có thông tin phòng. <button onClick={() => navigate('/rooms')}>Quay lại tìm phòng</button></p>
    </div>
  );

  return (
    <div className="booking-page">
      <div className="booking-page__inner">
        <h1 className="booking-page__title">Xác nhận đặt phòng</h1>

        <div className="booking-page__layout">
          {/* Form */}
          <div className="booking-page__form-col">
            <Card>
              <h3 className="booking-page__section-title">Thông tin lưu trú</h3>
              <form onSubmit={handleSubmit} className="booking-page__form">
                <div className="booking-page__row">
                  <Input label="Ngày nhận phòng" name="check_in_date" type="date"
                    value={form.check_in_date} onChange={handleChange}
                    error={errors.check_in_date} required
                    min={new Date().toISOString().split('T')[0]} />
                  <Input label="Ngày trả phòng" name="check_out_date" type="date"
                    value={form.check_out_date} onChange={handleChange}
                    error={errors.check_out_date} required
                    min={form.check_in_date} />
                </div>
                <div className="booking-page__row">
                  <div className="bp-field">
                    <label className="bp-label">Số người lớn</label>
                    <select name="adults" value={form.adults} onChange={handleChange} className="bp-select">
                      {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="bp-field">
                    <label className="bp-label">Số trẻ em</label>
                    <select name="children" value={form.children} onChange={handleChange} className="bp-select">
                      {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div className="bp-field bp-field--full">
                  <label className="bp-label">Yêu cầu đặc biệt</label>
                  <textarea name="special_request" value={form.special_request} onChange={handleChange}
                    className="bp-textarea" rows={3}
                    placeholder="Ví dụ: Phòng tầng cao, không hút thuốc, cần cũi cho em bé..." />
                </div>
                <div className="booking-page__payment-method">
                  <p className="bp-label">Phương thức thanh toán</p>
                  <div className="booking-page__pm-options">
                    <label className="booking-page__pm-option booking-page__pm-option--selected">
                      <input type="radio" defaultChecked readOnly />
                      <span><FaHotel color="#f5a623" /> Thanh toán tại khách sạn</span>
                    </label>
                  </div>
                </div>
                <Button type="submit" fullWidth loading={loading} size="lg" variant="accent">
                  Xác nhận đặt phòng
                </Button>
              </form>
            </Card>
          </div>

          {/* Summary */}
          <div className="booking-page__summary-col">
            <Card className="booking-page__summary">
              <h3 className="booking-page__section-title">Tóm tắt đặt phòng</h3>
              <div className="booking-summary">
                <div className="booking-summary__room">
                  <p className="booking-summary__room-number">Phòng {room.room_number}</p>
                  <p className="booking-summary__room-type">{roomType?.type_name}</p>
                  <p className="booking-summary__room-floor">Tầng {room.floor}</p>
                </div>
                <div className="booking-summary__divider" />
                <div className="booking-summary__row">
                  <span>Giá/đêm</span>
                  <span>{formatCurrency(pricePerNight)}</span>
                </div>
                <div className="booking-summary__row">
                  <span>Số đêm</span>
                  <span>{nights} đêm</span>
                </div>
                {nights > 0 && (
                  <>
                    <div className="booking-summary__divider" />
                    <div className="booking-summary__row booking-summary__row--total">
                      <span>Tổng tiền phòng</span>
                      <span className="booking-summary__total-amount">{formatCurrency(totalAmount)}</span>
                    </div>
                  </>
                )}
                <div className="booking-summary__note">
                  <p><FaCircleInfo color="#a07000" /> Dịch vụ bổ sung sẽ được tính khi trả phòng</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
