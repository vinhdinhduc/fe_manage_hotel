import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaBed, FaBuilding, FaCalendarDays, FaCircleInfo, FaPeopleGroup, FaRulerCombined } from 'react-icons/fa6';
import roomService from '../../../services/room.service';
import Spinner from '../../../components/common/Spinner/Spinner';
import Button from '../../../components/common/Button/Button';
import { RoomStatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency } from '../../../utils/formatters';
import './RoomDetailPage.css';

const formatAmenities = (amenities) => {
  if (!amenities) return [];

  if (Array.isArray(amenities)) {
    return amenities.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof amenities === 'string') {
    const normalized = amenities.trim();
    if (!normalized) return [];

    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || '').trim()).filter(Boolean);
      }
    } catch {
      return normalized.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [normalized];
  }

  return [];
};

const getToday = () => new Date().toISOString().split('T')[0];
const getTomorrow = () => new Date(Date.now() + 86400000).toISOString().split('T')[0];

const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [bookingDraft, setBookingDraft] = useState({
    check_in_date: getToday(),
    check_out_date: getTomorrow(),
    adults: 1,
  });

  useEffect(() => {
    let mounted = true;

    const loadRoom = async () => {
      setLoading(true);
      try {
        const response = await roomService.getById(id);
        const payload = response?.data?.room || null;
        if (!mounted) return;
        setRoom(payload);
        setError('');
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Không thể tải thông tin phòng.');
      }
      if (mounted) setLoading(false);
    };

    loadRoom();
    return () => {
      mounted = false;
    };
  }, [id]);

  const roomType = room?.roomType || room?.RoomType || null;
  const amenities = useMemo(() => formatAmenities(roomType?.amenities), [roomType?.amenities]);
  const imageUrl = room?.image_url || roomType?.image_url || '';

  const onBookNow = () => {
    navigate(`/rooms/${id}/book`, {
      state: {
        room,
        check_in_date: bookingDraft.check_in_date,
        check_out_date: bookingDraft.check_out_date,
        adults: Number(bookingDraft.adults) || 1,
      },
    });
  };

  if (loading) {
    return (
      <div className="room-detail-page room-detail-page--loading">
        <Spinner text="Đang tải thông tin phòng..." />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="room-detail-page room-detail-page--empty">
        <h2>Không tìm thấy phòng</h2>
        <p>{error || 'Phòng bạn tìm không tồn tại hoặc đã bị xóa.'}</p>
        <Button variant="secondary" onClick={() => navigate('/rooms')}>Quay lại danh sách phòng</Button>
      </div>
    );
  }

  return (
    <div className="room-detail-page">
      <div className="room-detail-page__inner">
        <div className="room-detail-page__hero">
          <div className="room-detail-page__media">
            {imageUrl ? (
              <img src={imageUrl} alt={`Phòng ${room.room_number}`} className="room-detail-page__image" />
            ) : (
              <div className="room-detail-page__image room-detail-page__image--placeholder">
                <FaBed />
                <span>Chưa có hình ảnh phòng</span>
              </div>
            )}
          </div>

          <div className="room-detail-page__summary">
            <div className="room-detail-page__summary-top">
              <h1>Phòng {room.room_number}</h1>
              <RoomStatusBadge status={room.status} />
            </div>

            <p className="room-detail-page__type">{roomType?.type_name || 'Loại phòng đang cập nhật'}</p>

            <div className="room-detail-page__meta-grid">
              <div>
                <span><FaBuilding /> Tầng</span>
                <strong>{room.floor}</strong>
              </div>
              <div>
                <span><FaPeopleGroup /> Sức chứa</span>
                <strong>{roomType?.max_occupancy || 1} người</strong>
              </div>
              <div>
                <span><FaRulerCombined /> Diện tích</span>
                <strong>{roomType?.area_sqm || 'Đang cập nhật'} m²</strong>
              </div>
              <div>
                <span><FaCircleInfo /> Giá theo đêm</span>
                <strong>{formatCurrency(roomType?.base_price || 0)}</strong>
              </div>
            </div>

            <div className="room-detail-page__booking-box">
              <h3>Thông tin đặt phòng</h3>
              <div className="room-detail-page__booking-grid">
                <label>
                  <span><FaCalendarDays /> Nhận phòng</span>
                  <input
                    type="date"
                    value={bookingDraft.check_in_date}
                    onChange={(event) => setBookingDraft((prev) => ({ ...prev, check_in_date: event.target.value }))}
                    min={getToday()}
                  />
                </label>
                <label>
                  <span><FaCalendarDays /> Trả phòng</span>
                  <input
                    type="date"
                    value={bookingDraft.check_out_date}
                    onChange={(event) => setBookingDraft((prev) => ({ ...prev, check_out_date: event.target.value }))}
                    min={bookingDraft.check_in_date || getToday()}
                  />
                </label>
                <label>
                  <span><FaPeopleGroup /> Số người lớn</span>
                  <select
                    value={bookingDraft.adults}
                    onChange={(event) => setBookingDraft((prev) => ({ ...prev, adults: event.target.value }))}
                  >
                    {[1, 2, 3, 4].map((number) => (
                      <option key={number} value={number}>{number} người</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="room-detail-page__booking-actions">
                <Button variant="secondary" onClick={() => navigate('/rooms')}>Xem phòng khác</Button>
                <Button variant="accent" onClick={onBookNow}>Đặt phòng ngay</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="room-detail-page__content">
          <section className="room-detail-page__section">
            <h2>Mô tả phòng</h2>
            <p>{roomType?.description || room.note || 'Thông tin mô tả đang được cập nhật.'}</p>
          </section>

          <section className="room-detail-page__section">
            <h2>Tiện nghi nổi bật</h2>
            {amenities.length > 0 ? (
              <div className="room-detail-page__amenities">
                {amenities.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : (
              <p>Danh sách tiện nghi đang được cập nhật.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;
