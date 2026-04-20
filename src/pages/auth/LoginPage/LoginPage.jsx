import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock } from 'react-icons/fa6';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import useToast from '../../../hooks/useToast';
import './LoginPage.css';

const REMEMBER_CREDENTIALS_KEY = 'remembered_credentials';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(REMEMBER_CREDENTIALS_KEY) || 'null');
      if (stored?.email && stored?.password) {
        setForm({ email: stored.email, password: stored.password, remember: true });
      }
    } catch {
      localStorage.removeItem(REMEMBER_CREDENTIALS_KEY);
    }
  }, []);

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

  const handleRememberChange = (event) => {
    const checked = event.target.checked;
    setForm((prev) => ({ ...prev, remember: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      const user = await login({ email: form.email, password: form.password }, form.remember);

      if (form.remember) {
        localStorage.setItem(
          REMEMBER_CREDENTIALS_KEY,
          JSON.stringify({ email: form.email, password: form.password }),
        );
      } else {
        localStorage.removeItem(REMEMBER_CREDENTIALS_KEY);
      }

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
          error={errors.email} required icon={<FaEnvelope color="#64748b" />} autoComplete="email" />
        <Input label="Mật khẩu" name="password" type="password" value={form.password}
          onChange={handleChange} placeholder="••••••••"
          error={errors.password} required icon={<FaLock color="#64748b" />} autoComplete="current-password" />

        <div className="login-page__options">
          <label className="login-page__remember">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleRememberChange}
            />
            <span>Nhớ mật khẩu</span>
          </label>
          <Link to="/forgot-password" className="login-page__forgot">Quên mật khẩu?</Link>
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg" variant="primary">
          Đăng nhập
        </Button>
      </form>
      <p className="login-page__register">
        Chưa có tài khoản? <Link to="/register" className="login-page__link">Đăng ký ngay</Link>
      </p>
    </div>
  );
};

export default LoginPage;
