import { Outlet } from 'react-router-dom';
import { FaHotel } from 'react-icons/fa6';
import './AuthLayout.css';

const AuthLayout = () => (
  <div className="auth-layout">
    <div className="auth-layout__bg">
      <div className="auth-layout__overlay" />
      <div className="auth-layout__pattern" />
    </div>
    <div className="auth-layout__card">
      <div className="auth-layout__brand">
        <div className="auth-layout__logo"><FaHotel color="#f5a623" /></div>
        <h1 className="auth-layout__brand-name">Khách Sạn Sơn La</h1>
        <p className="auth-layout__brand-sub">Hệ thống quản lý khách sạn</p>
      </div>
      <Outlet />
    </div>
  </div>
);

export default AuthLayout;
