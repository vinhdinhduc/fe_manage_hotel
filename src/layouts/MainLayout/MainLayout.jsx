import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaArrowRightFromBracket, FaBars, FaChartColumn, FaUser } from 'react-icons/fa6';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/logo.png';
import './MainLayout.css';

const MainLayout = () => {
  const { isAuthenticated, user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); };

  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="main-header__inner">
          <Link to="/" className="main-header__brand">
            <span className="main-header__brand-icon">
              <img src={logoImage} alt="Logo Khách Sạn Sơn La" />
            </span>
            <div>
              <span className="main-header__brand-name">Khách Sạn Sơn La</span>
            </div>
          </Link>

          <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`}>
            <NavLink to="/" className={({isActive}) => `main-nav__link ${isActive && location.pathname === '/' ? 'main-nav__link--active' : ''}`} onClick={() => setMenuOpen(false)}>Trang chủ</NavLink>
            <NavLink to="/rooms" className={({isActive}) => `main-nav__link ${isActive ? 'main-nav__link--active' : ''}`} onClick={() => setMenuOpen(false)}>Tìm phòng</NavLink>
            {isAuthenticated && !isStaff && (
              <NavLink to="/my-bookings" className={({isActive}) => `main-nav__link ${isActive ? 'main-nav__link--active' : ''}`} onClick={() => setMenuOpen(false)}>Đặt phòng của tôi</NavLink>
            )}
          </nav>

          <div className="main-header__actions">
            {isAuthenticated ? (
              <div className="main-header__user">
                <div className="main-header__user-menu">
                  <div className="main-header__avatar">{user?.full_name?.[0] || 'U'}</div>
                  <span className="main-header__user-name">{user?.full_name?.split(' ').slice(-1)[0]}</span>
                  <div className="main-header__dropdown">
                    <Link to="/profile" className="main-header__dropdown-item"><FaUser color="#64748b" /> Tài khoản</Link>
                    {isStaff && <Link to="/dashboard" className="main-header__dropdown-item"><FaChartColumn color="#3b82f6" /> Quản trị</Link>}
                    <button onClick={handleLogout} className="main-header__dropdown-item main-header__dropdown-item--danger"><FaArrowRightFromBracket color="#e5534b" /> Đăng xuất</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="main-header__btn main-header__btn--ghost">Đăng nhập</Link>
                <Link to="/register" className="main-header__btn main-header__btn--primary">Đăng ký</Link>
              </>
            )}
            <button className="main-header__hamburger" onClick={() => setMenuOpen(v => !v)}><FaBars /></button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="main-footer">
        <div className="main-footer__inner">
          <p className="main-footer__copy">© 2026 Khách Sạn Sơn La — Hệ thống quản lý khách sạn </p>
          <div className="main-footer__links">
            <Link to="/">Trang chủ</Link>
            <Link to="/rooms">Phòng</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
