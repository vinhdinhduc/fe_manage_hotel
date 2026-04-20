import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa6';
import authService from '../../../services/auth.service';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import useToast from '../../../hooks/useToast';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email.trim()) return 'Vui lòng nhập email';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Email không hợp lệ';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateEmail();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSubmitted(true);
      setError('');
      toast.success('Đã gửi hướng dẫn đặt lại mật khẩu.');
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-recovery-page">
      <h2 className="auth-recovery-page__title">Quên mật khẩu</h2>
      <p className="auth-recovery-page__sub">
        Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
      </p>

      {submitted ? (
        <div className="auth-recovery-page__notice">
          Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.
          Vui lòng kiểm tra hộp thư và thư rác.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-recovery-page__form" noValidate>
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError('');
            }}
            placeholder="your@email.com"
            icon={<FaEnvelope color="#64748b" />}
            error={error}
            required
            autoComplete="email"
          />

          <Button type="submit" fullWidth loading={loading} size="lg" variant="primary">
            Gửi liên kết đặt lại
          </Button>
        </form>
      )}

      <p className="auth-recovery-page__back">
        <Link to="/login" className="auth-recovery-page__link">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
