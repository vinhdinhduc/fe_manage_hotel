import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaDoorOpen, FaHotel, FaKey, FaMagnifyingGlass, FaMoneyBillWave, FaPeopleGroup } from 'react-icons/fa6';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import './HomePage.css';

const FEATURES = [
  { icon: <FaMagnifyingGlass color="#3b82f6" />, title: 'Tìm kiếm dễ dàng', desc: 'Tìm phòng trống theo ngày và loại phòng chỉ trong vài giây' },
  { icon: <FaHotel color="#2dbe6c" />, title: 'Đặt phòng trực tuyến', desc: 'Xác nhận đặt phòng ngay lập tức, nhận mã đặt phòng qua hệ thống' },
  { icon: <FaMoneyBillWave color="#f59e0b" />, title: 'Thanh toán linh hoạt', desc: 'Tiền mặt, chuyển khoản, hoặc thanh toán thẻ ngân hàng' },
  { icon: <FaBell color="#22c55e" />, title: 'Dịch vụ đa dạng', desc: 'Spa, đưa đón sân bay, phòng ăn và nhiều tiện ích hơn' },
];

const ROOM_TYPES = [
  { name: 'Phòng Đơn', price: '500.000', icon: <FaHotel color="#f5a623" />, note: '/đêm' },
  { name: 'Phòng Đôi', price: '750.000', icon: <FaDoorOpen color="#3b82f6" />, note: '/đêm' },
  { name: 'Phòng Suite', price: '1.500.000', icon: <FaKey color="#e5534b" />, note: '/đêm' },
  { name: 'Phòng Gia Đình', price: '1.200.000', icon: <FaPeopleGroup color="#8b5cf6" />, note: '/đêm' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [search, setSearch] = useState({ check_in_date: today, check_out_date: tomorrow, adults: 1 });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(search);
    navigate(`/rooms?${params.toString()}`);
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__content">
          <div className="hero__badge"><FaHotel color="#f5a623" /> Đặt phòng trực tuyến</div>
          <h1 className="hero__title">Khách Sạn<br /><span className="hero__title--accent">Sơn La</span></h1>
          <p className="hero__sub">Trải nghiệm dịch vụ lưu trú đẳng cấp giữa vùng Tây Bắc hùng vĩ. Đặt phòng dễ dàng, nhanh chóng và an toàn.</p>

          {/* Search Form */}
          <form className="hero__search" onSubmit={handleSearch}>
            <div className="hero__search-field">
              <label className="hero__search-label">Nhận phòng</label>
              <input type="date" className="hero__search-input" value={search.check_in_date}
                onChange={e => setSearch(s => ({ ...s, check_in_date: e.target.value }))}
                min={today} />
            </div>
            <div className="hero__search-field">
              <label className="hero__search-label">Trả phòng</label>
              <input type="date" className="hero__search-input" value={search.check_out_date}
                onChange={e => setSearch(s => ({ ...s, check_out_date: e.target.value }))}
                min={search.check_in_date} />
            </div>
            <div className="hero__search-field">
              <label className="hero__search-label">Số người lớn</label>
              <select className="hero__search-input" value={search.adults}
                onChange={e => setSearch(s => ({ ...s, adults: e.target.value }))}>
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} người</option>)}
              </select>
            </div>
            <Button type="submit" variant="accent" size="lg" className="hero__search-btn">Tìm phòng →</Button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-features__inner">
          <h2 className="home-section-title">Tại sao chọn chúng tôi?</h2>
          <div className="home-features__grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Room Types */}
      <section className="home-rooms">
        <div className="home-rooms__inner">
          <h2 className="home-section-title">Loại phòng</h2>
          <p className="home-section-sub">Đa dạng lựa chọn phù hợp mọi nhu cầu</p>
          <div className="home-rooms__grid">
            {ROOM_TYPES.map(r => (
              <div key={r.name} className="room-type-card" onClick={() => navigate('/rooms')}>
                <div className="room-type-card__emoji">{r.icon}</div>
                <h3 className="room-type-card__name">{r.name}</h3>
                <p className="room-type-card__price">
                  <span className="room-type-card__amount">{r.price}đ</span>
                  <span className="room-type-card__note">{r.note}</span>
                </p>
                <span className="room-type-card__cta">Xem phòng →</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
