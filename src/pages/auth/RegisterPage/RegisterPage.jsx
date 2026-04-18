import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../../services/auth.service';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import useToast from '../../../hooks/useToast';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', address:'', id_card:'', password:'', confirm_password:'' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Vui lòng nhập họ tên';
    if (!form.email) e.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.phone) e.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(form.phone)) e.phone = 'Số điện thoại không hợp lệ';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự';
    if (form.password !== form.confirm_password) e.confirm_password = 'Mật khẩu xác nhận không khớp';
    return e;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authService.register(form);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <h2 className="register-page__title">Đăng ký tài khoản</h2>
      <p className="register-page__sub">Tạo tài khoản để đặt phòng trực tuyến</p>
      <form onSubmit={handleSubmit} className="register-page__form" noValidate>
        <div className="register-page__row">
          <Input label="Họ và tên" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Nguyễn Văn A" error={errors.full_name} required />
          <Input label="Số CCCD" name="id_card" value={form.id_card} onChange={handleChange} placeholder="012345678901" error={errors.id_card} />
        </div>
        <div className="register-page__row">
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" error={errors.email} required />
          <Input label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} placeholder="0987654321" error={errors.phone} required />
        </div>
        <Input label="Địa chỉ" name="address" value={form.address} onChange={handleChange} placeholder="Thành phố Sơn La" error={errors.address} />
        <div className="register-page__row">
          <Input label="Mật khẩu" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Tối thiểu 8 ký tự" error={errors.password} required />
          <Input label="Xác nhận mật khẩu" name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} placeholder="Nhập lại mật khẩu" error={errors.confirm_password} required />
        </div>
        <Button type="submit" fullWidth loading={loading} size="lg" variant="primary">Đăng ký</Button>
      </form>
      <p className="register-page__login">Đã có tài khoản? <Link to="/login" className="register-page__link">Đăng nhập</Link></p>
    </div>
  );
};

export default RegisterPage;
