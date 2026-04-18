import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaArrowRightFromBracket,
  FaBars,
  FaChartColumn,
  FaClipboardList,
  FaBell,
  FaGlobe,
  FaHotel,
  FaHouse,
  FaKey,
  FaTags,
  FaUser,
  FaUsers,
  FaXmark,
} from 'react-icons/fa6';
import './AdminLayout.css';

const navItems = [
  { group: 'Tổng quan', items: [
    { to: '/dashboard', icon: <FaChartColumn size={18} color="#72b8ff" />, label: 'Dashboard' },
  ]},
  { group: 'Nghiệp vụ', items: [
    { to: '/manage/bookings', icon: <FaClipboardList size={18} color="#9f7aea" />, label: 'Đặt phòng' },
    { to: '/manage/check-in-out', icon: <FaKey size={18} color="#2dbe6c" />, label: 'Check-in/out' },
    { to: '/manage/rooms', icon: <FaHouse size={18} color="#f5a623" />, label: 'Quản lý phòng' },
    { to: '/manage/room-types', icon: <FaTags size={18} color="#f59e0b" />, label: 'Loại phòng' },
    { to: '/manage/services', icon: <FaBell size={18} color="#22c55e" />, label: 'Dịch vụ' },
  ]},
  { group: 'Quản trị', roles: ['admin'], items: [
    { to: '/admin/employees', icon: <FaUsers size={18} color="#38bdf8" />, label: 'Nhân viên' },
    { to: '/admin/users', icon: <FaUser size={18} color="#94a3b8" />, label: 'Khách hàng' },
    { to: '/admin/reports', icon: <FaChartColumn size={18} color="#ef4444" />, label: 'Báo cáo' },
  ]},
];

const AdminLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`admin-layout ${sidebarOpen ? 'admin-layout--open' : ''}`}>
      {/* Overlay for mobile */}
      <div className="admin-layout__overlay" onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__header">
          <span className="sidebar__logo"><FaHotel size={24} color="#f5a623" /></span>
          <div>
            <p className="sidebar__hotel">Khách Sạn Sơn La</p>
            <p className="sidebar__system">Hệ thống quản lý</p>
          </div>
          <button className="sidebar__close" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu"><FaXmark /></button>
        </div>

        <nav className="sidebar__nav">
          {navItems
            .filter(g => !g.roles || g.roles.includes(user?.role))
            .map(group => (
            <div key={group.group} className="sidebar__group">
              <p className="sidebar__group-label">{group.group}</p>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sidebar__item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{user?.full_name?.[0] || 'U'}</div>
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{user?.full_name}</p>
              <p className="sidebar__user-role">{isAdmin ? 'Quản lý' : 'Lễ tân'}</p>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout} title="Đăng xuất" aria-label="Đăng xuất"><FaArrowRightFromBracket /></button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-header">
          <button className="admin-header__menu" onClick={() => setSidebarOpen(true)} aria-label="Mở menu"><FaBars /></button>
          <div className="admin-header__right">
            <NavLink to="/" className="admin-header__link"><FaGlobe /> Trang chủ</NavLink>
            <button className="admin-header__logout-btn" onClick={handleLogout}>Đăng xuất</button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
