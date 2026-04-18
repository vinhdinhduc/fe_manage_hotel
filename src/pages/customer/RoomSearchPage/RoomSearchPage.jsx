import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FaBuilding, FaHotel, FaMagnifyingGlass, FaPeopleGroup, FaRulerCombined, FaRotateRight } from 'react-icons/fa6';
import roomService from '../../../services/room.service';
import roomTypeService from '../../../services/roomType.service';
import Spinner from '../../../components/common/Spinner/Spinner';
import { RoomStatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency } from '../../../utils/formatters';
import { pickArray } from '../../../utils/apiData';
import { useAuth } from '../../../contexts/AuthContext';
import './RoomSearchPage.css';

const RoomSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    check_in_date: searchParams.get('check_in_date') || today,
    check_out_date: searchParams.get('check_out_date') || tomorrow,
    adults: searchParams.get('adults') || 1,
    type_id: searchParams.get('type_id') || '',
    max_price: '',
  });
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    roomTypeService.getAll().then(r => setRoomTypes(pickArray(r?.data, ['roomTypes']))).catch(() => {});
  }, []);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!filters.check_in_date || !filters.check_out_date) return;
    setLoading(true); setSearched(true);
    try {
      const params = { check_in_date: filters.check_in_date, check_out_date: filters.check_out_date, adults: filters.adults };
      if (filters.type_id) params.type_id = filters.type_id;
      if (filters.max_price) params.max_price = filters.max_price;
      const res = await roomService.search(params);
      setRooms(pickArray(res?.data, ['rooms']));
    } catch { setRooms([]); }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    if (searchParams.get('check_in_date')) handleSearch();
  }, []);

  const handleFilterChange = (e) => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleBook = (room) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const roomId = room?.room_id || room?.id;
    navigate(`/rooms/${roomId}/book`, {
      state: { room, check_in_date: filters.check_in_date, check_out_date: filters.check_out_date, adults: filters.adults }
    });
  };

  return (
    <div className="room-search-page">
      {/* Filter Bar */}
      <div className="room-search-page__filter-bar">
        <div className="room-search-page__filter-inner">
          <h2 className="room-search-page__title">Tìm phòng trống</h2>
          <form className="room-search-page__form" onSubmit={handleSearch}>
            <div className="rs-field">
              <label className="rs-label">Nhận phòng</label>
              <input type="date" name="check_in_date" value={filters.check_in_date} min={today}
                onChange={handleFilterChange} className="rs-input" />
            </div>
            <div className="rs-field">
              <label className="rs-label">Trả phòng</label>
              <input type="date" name="check_out_date" value={filters.check_out_date} min={filters.check_in_date}
                onChange={handleFilterChange} className="rs-input" />
            </div>
            <div className="rs-field">
              <label className="rs-label">Số người</label>
              <select name="adults" value={filters.adults} onChange={handleFilterChange} className="rs-input">
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} người</option>)}
              </select>
            </div>
            <div className="rs-field">
              <label className="rs-label">Loại phòng</label>
              <select name="type_id" value={filters.type_id} onChange={handleFilterChange} className="rs-input">
                <option value="">Tất cả</option>
                {roomTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
              </select>
            </div>
            <div className="rs-field">
              <label className="rs-label">Giá tối đa (VNĐ)</label>
              <input type="number" name="max_price" value={filters.max_price} placeholder="Không giới hạn"
                onChange={handleFilterChange} className="rs-input" min="0" step="100000" />
            </div>
            <button type="submit" className="rs-search-btn" disabled={loading}>
              {loading ? <FaRotateRight className="rs-search-btn__icon rs-search-btn__icon--spin" /> : <FaMagnifyingGlass className="rs-search-btn__icon" />} Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="room-search-page__results">
        {loading ? (
          <Spinner text="Đang tìm phòng..." />
        ) : searched && rooms.length === 0 ? (
          <div className="room-search-page__empty">
            <div className="room-search-page__empty-icon"><FaMagnifyingGlass color="#64748b" /></div>
            <h3>Không tìm thấy phòng phù hợp</h3>
            <p>Hãy thử thay đổi ngày hoặc điều chỉnh bộ lọc</p>
          </div>
        ) : rooms.length > 0 ? (
          <>
            <p className="room-search-page__count">Tìm thấy <strong>{rooms.length}</strong> phòng phù hợp</p>
            <div className="room-search-page__grid">
              {rooms.map(room => (
                <div key={room.room_id || room.id} className="room-card">
                  {(() => {
                    const roomType = room.roomType || room.RoomType;
                    return (
                      <>
                  <div className="room-card__header">
                    <div className="room-card__number">Phòng {room.room_number}</div>
                    <RoomStatusBadge status={room.status} />
                  </div>
                  <div className="room-card__type">{roomType?.type_name || 'N/A'}</div>
                  <div className="room-card__details">
                    <span><FaBuilding color="#64748b" /> Tầng {room.floor}</span>
                    <span><FaPeopleGroup color="#64748b" /> {roomType?.max_occupancy || 2} người</span>
                    <span><FaRulerCombined color="#64748b" /> {roomType?.area_sqm || '—'} m²</span>
                  </div>
                  {roomType?.amenities && (
                    <p className="room-card__amenities">{roomType.amenities.slice(0, 60)}{roomType.amenities.length > 60 ? '...' : ''}</p>
                  )}
                  <div className="room-card__footer">
                    <div className="room-card__price">
                      <span className="room-card__price-amount">{formatCurrency(roomType?.base_price ?? roomType?.price_per_night)}</span>
                      <span className="room-card__price-unit">/đêm</span>
                    </div>
                    <button className="room-card__book-btn" onClick={() => handleBook(room)}
                      disabled={room.status !== 'Available'}>
                      {room.status === 'Available' ? 'Đặt phòng' : 'Không khả dụng'}
                    </button>
                  </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          </>
        ) : !searched ? (
          <div className="room-search-page__prompt">
            <div className="room-search-page__prompt-icon"><FaHotel color="#64748b" /></div>
            <p>Chọn ngày và nhấn <strong>Tìm kiếm</strong> để xem phòng trống</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RoomSearchPage;
