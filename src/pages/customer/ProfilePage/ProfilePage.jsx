import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import userService from '../../../services/user.service';
import authService from '../../../services/auth.service';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import Card from '../../../components/common/Card';
import useToast from '../../../hooks/useToast';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', address: user?.address || '', id_card: user?.id_card || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwErrors, setPwErrors] = useState({});

  const handleInfoChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handlePwChange = (e) => { setPwForm(f => ({ ...f, [e.target.name]: e.target.value })); setPwErrors(er => ({ ...er, [e.target.name]: '' })); };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userService.updateMe(form);
      updateUser(res.data);
      toast.success('Cập nhật thông tin thành công');
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  const validatePw = () => {
    const e = {};
    if (!pwForm.current_password) e.current_password = 'Nhập mật khẩu hiện tại';
    if (!pwForm.new_password || pwForm.new_password.length < 8) e.new_password = 'Mật khẩu mới tối thiểu 8 ký tự';
    if (pwForm.new_password !== pwForm.confirm_password) e.confirm_password = 'Mật khẩu không khớp';
    return e;
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setSaving(true);
    try {
      await authService.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Đổi mật khẩu thành công');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-page__inner">
        <div className="profile-page__header">
          <div className="profile-page__avatar">{user?.full_name?.[0] || 'U'}</div>
          <div>
            <h1 className="profile-page__name">{user?.full_name}</h1>
            <p className="profile-page__email">{user?.email}</p>
          </div>
        </div>
        <div className="profile-page__tabs">
          <button className={`profile-page__tab ${tab === 'info' ? 'profile-page__tab--active' : ''}`} onClick={() => setTab('info')}>Thông tin cá nhân</button>
          <button className={`profile-page__tab ${tab === 'pw' ? 'profile-page__tab--active' : ''}`} onClick={() => setTab('pw')}>Đổi mật khẩu</button>
        </div>
        {tab === 'info' ? (
          <Card>
            <form onSubmit={handleSaveInfo} className="profile-page__form">
              <div className="profile-page__row">
                <Input label="Họ và tên" name="full_name" value={form.full_name} onChange={handleInfoChange} required />
                <Input label="Số điện thoại" name="phone" value={form.phone} onChange={handleInfoChange} />
              </div>
              <div className="profile-page__row">
                <Input label="Địa chỉ" name="address" value={form.address} onChange={handleInfoChange} />
                <Input label="Số CCCD" name="id_card" value={form.id_card} onChange={handleInfoChange} />
              </div>
              <Input label="Email" name="email" value={user?.email} disabled hint="Email không thể thay đổi" />
              <div className="profile-page__actions">
                <Button type="submit" variant="primary" loading={saving}>Lưu thay đổi</Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleChangePw} className="profile-page__form">
              <Input label="Mật khẩu hiện tại" name="current_password" type="password" value={pwForm.current_password} onChange={handlePwChange} error={pwErrors.current_password} required />
              <Input label="Mật khẩu mới" name="new_password" type="password" value={pwForm.new_password} onChange={handlePwChange} error={pwErrors.new_password} required hint="Tối thiểu 8 ký tự" />
              <Input label="Xác nhận mật khẩu mới" name="confirm_password" type="password" value={pwForm.confirm_password} onChange={handlePwChange} error={pwErrors.confirm_password} required />
              <div className="profile-page__actions">
                <Button type="submit" variant="primary" loading={saving}>Đổi mật khẩu</Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
