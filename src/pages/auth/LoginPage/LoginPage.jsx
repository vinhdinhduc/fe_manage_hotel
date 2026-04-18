import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaHotel, FaLock, FaUserShield } from 'react-icons/fa6';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import useToast from '../../../hooks/useToast';
import './LoginPage.css';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    return errs;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      const user = await login(form);
      toast.success('Đăng nhập thành công!');
      navigate(user.role === 'customer' ? '/' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="login-page">
      <h2 className="login-page__title">Đăng nhập</h2>
      <p className="login-page__sub">Chào mừng bạn trở lại</p>
      <form onSubmit={handleSubmit} className="login-page__form" noValidate>
        <Input label="Email" name="email" type="email" value={form.email}
          onChange={handleChange} placeholder="your@email.com"
          error={errors.email} required icon={<FaEnvelope color="#64748b" />} />
        <Input label="Mật khẩu" name="password" type="password" value={form.password}
          onChange={handleChange} placeholder="••••••••"
          error={errors.password} required icon={<FaLock color="#64748b" />} />
        <Button type="submit" fullWidth loading={loading} size="lg" variant="primary">
          Đăng nhập
        </Button>
      </form>
      <div className="login-page__demo">
        <p className="login-page__demo-title">Tài khoản demo</p>
        <div className="login-page__demo-accounts">
          <button className="login-page__demo-btn" onClick={() => setForm({ email: 'admin@khachsan-sonla.vn', password: 'password' })}>
            <FaUserShield color="#ef4444" /> Admin
          </button>
          <button className="login-page__demo-btn" onClick={() => setForm({ email: 'lan.letan@khachsan-sonla.vn', password: 'password' })}>
            <FaHotel color="#f5a623" /> Lễ tân
          </button>
        </div>
      </div>
      <p className="login-page__register">
        Chưa có tài khoản? <Link to="/register" className="login-page__link">Đăng ký ngay</Link>
      </p>
    </div>
  );
};

export default LoginPage;
