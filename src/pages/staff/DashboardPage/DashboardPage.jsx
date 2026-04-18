import { useState, useEffect } from 'react';
import { FaClipboardList, FaDoorOpen, FaHotel, FaKey, FaMoneyBillWave, FaPeopleGroup } from 'react-icons/fa6';
import reportService from '../../../services/report.service';
import Spinner from '../../../components/common/Spinner/Spinner';
import { formatCurrency } from '../../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './DashboardPage.css';

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="stat-card" style={{ '--stat-color': color }}>
    <div className="stat-card__icon">{icon}</div>
    <div className="stat-card__body">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {sub && <p className="stat-card__sub">{sub}</p>}
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.dashboard()
      .then(r => setStats(r?.data?.stats || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Đang tải dashboard..." />;

  const rooms = stats?.rooms || {};
  const today = stats?.today || {};
  const pendingBookings = stats?.pendingBookings || 0;
  const monthRevenue = stats?.monthRevenue || 0;

  const occupancyRate = rooms.total > 0 ? Math.round((rooms.occupied / rooms.total) * 100) : 0;
  const availableRooms = rooms.available || 0;
  const occupiedRooms = rooms.occupied || 0;
  const totalRooms = rooms.total || 0;
  const bookedRooms = Math.max(0, totalRooms - availableRooms - occupiedRooms);

  const chartData = [
    { name: 'Trống', value: availableRooms, fill: '#2dbe6c' },
    { name: 'Đã đặt', value: bookedRooms, fill: '#3b82f6' },
    { name: 'Đang ở', value: occupiedRooms, fill: '#f5a623' },
    { name: 'Bảo trì', value: Math.max(0, totalRooms - availableRooms - bookedRooms - occupiedRooms), fill: '#a78bfa' },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">Dashboard</h1>
        <p className="dashboard-page__date">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="dashboard-page__stats">
        <StatCard icon={<FaHotel size={20} />} label="Tổng số phòng" value={totalRooms} sub={`${occupancyRate}% lấp đầy`} color="var(--color-primary)" />
        <StatCard icon={<FaDoorOpen size={20} />} label="Phòng trống" value={availableRooms} sub="Sẵn sàng đón khách" color="var(--color-success)" />
        <StatCard icon={<FaPeopleGroup size={20} />} label="Đang lưu trú" value={occupiedRooms} sub="Khách đang ở" color="var(--color-warning)" />
        <StatCard icon={<FaClipboardList size={20} />} label="Chờ xác nhận" value={pendingBookings} sub="Cần xử lý" color="var(--color-accent)" />
        <StatCard icon={<FaKey size={20} />} label="Check-in hôm nay" value={today.checkIns || 0} sub={`Check-out: ${today.checkOuts || 0}`} color="var(--color-info)" />
        <StatCard icon={<FaMoneyBillWave size={20} />} label="Doanh thu tháng" value={formatCurrency(monthRevenue)} sub="Đã thanh toán" color="var(--color-accent-dark)" />
      </div>

      <div className="dashboard-page__charts">
        <div className="dashboard-chart">
          <h3 className="dashboard-chart__title">Tình trạng phòng</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
              <YAxis fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
              <Tooltip formatter={(v) => [v, 'Số phòng']} />
              <Bar dataKey="value" fill="var(--color-primary)" radius={[4,4,0,0]}>
                {chartData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-chart">
          <h3 className="dashboard-chart__title">Trạng thái đặt phòng hôm nay</h3>
          <div className="dashboard-booking-stats">
            {[
              { label: 'Chờ xác nhận', value: pendingBookings, color: 'var(--booking-pending)' },
              { label: 'Check-in hôm nay', value: today.checkIns || 0, color: 'var(--booking-confirmed)' },
              { label: 'Check-out hôm nay', value: today.checkOuts || 0, color: 'var(--booking-checked-in)' },
              { label: 'Đang lưu trú', value: occupiedRooms, color: 'var(--booking-completed)' },
            ].map(item => (
              <div key={item.label} className="dashboard-booking-stat">
                <div className="dashboard-booking-stat__bar" style={{ '--w': `${Math.min(100, (item.value / Math.max(1, pendingBookings + (today.checkIns || 0) + (today.checkOuts || 0) + occupiedRooms)) * 100)}%`, '--c': item.color }} />
                <div className="dashboard-booking-stat__info">
                  <span className="dashboard-booking-stat__label" style={{ color: item.color }}>{item.label}</span>
                  <span className="dashboard-booking-stat__value">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
