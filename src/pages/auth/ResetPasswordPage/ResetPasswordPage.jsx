import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaLock } from 'react-icons/fa6';
import authService from '../../../services/auth.service';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import useToast from '../../../hooks/useToast';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);

  const [form, setForm] = useState({
    new_password: '',
    confirm_new_password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!token) nextErrors.token = 'Liên kết đặt lại mật khẩu không hợp lệ.';
    if (!form.new_password) nextErrors.new_password = 'Vui lòng nhập mật khẩu mới';
    else if (form.new_password.length < 8) nextErrors.new_password = 'Mật khẩu mới tối thiểu 8 ký tự';
    if (form.confirm_new_password !== form.new_password) {
      nextErrors.confirm_new_password = 'Xác nhận mật khẩu không khớp';
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        token,
        new_password: form.new_password,
        confirm_new_password: form.confirm_new_password,
      });
      setDone(true);
      toast.success('Đặt lại mật khẩu thành công.');
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-reset-page">
      <h2 className="auth-reset-page__title">Đặt lại mật khẩu</h2>
      <p className="auth-reset-page__sub">Nhập mật khẩu mới cho tài khoản của bạn.</p>

      {errors.token ? (
        <div className="auth-reset-page__notice auth-reset-page__notice--error">
          {errors.token}
        </div>
      ) : null}

      {done ? (
        <div className="auth-reset-page__notice">
          Mật khẩu đã được cập nhật. Đang chuyển sang trang đăng nhập...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-reset-page__form" noValidate>
          <Input
            label="Mật khẩu mới"
            name="new_password"
            type="password"
            value={form.new_password}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, new_password: event.target.value }));
              if (errors.new_password) setErrors((prev) => ({ ...prev, new_password: '' }));
            }}
            placeholder="Tối thiểu 8 ký tự"
            icon={<FaLock color="#64748b" />}
            error={errors.new_password}
            required
            autoComplete="new-password"
          />

          <Input
            label="Xác nhận mật khẩu mới"
            name="confirm_new_password"
            type="password"
            value={form.confirm_new_password}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, confirm_new_password: event.target.value }));
              if (errors.confirm_new_password) setErrors((prev) => ({ ...prev, confirm_new_password: '' }));
            }}
            placeholder="Nhập lại mật khẩu mới"
            icon={<FaLock color="#64748b" />}
            error={errors.confirm_new_password}
            required
            autoComplete="new-password"
          />

          <Button type="submit" fullWidth loading={loading} size="lg" variant="primary" disabled={!token}>
            Cập nhật mật khẩu
          </Button>
        </form>
      )}

      <p className="auth-reset-page__back">
        <Link to="/login" className="auth-reset-page__link">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
};

export default ResetPasswordPage;
