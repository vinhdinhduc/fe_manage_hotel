import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import reportService from '../../services/report.service';
import authService from '../../services/auth.service';
import userService from '../../services/user.service';
import { formatCurrency } from '../../utils/formatters';
import useToast from '../../hooks/useToast';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import {
  FaArrowRightFromBracket,
  FaBars,
  FaChartColumn,
  FaClipboardList,
  FaClock,
  FaCircleExclamation,
  FaBell,
  FaChevronDown,
  FaChevronRight,
  FaGlobe,
  FaHotel,
  FaHouse,
  FaKey,
  FaMagnifyingGlass,
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

const routeMeta = [
  {
    match: /^\/dashboard$/,
    title: 'Dashboard',
    breadcrumb: ['Tổng quan', 'Dashboard'],
  },
  {
    match: /^\/manage\/bookings/,
    title: 'Quản lý đặt phòng',
    breadcrumb: ['Nghiệp vụ', 'Đặt phòng'],
  },
  {
    match: /^\/manage\/check-in-out/,
    title: 'Check-in / Check-out',
    breadcrumb: ['Nghiệp vụ', 'Check-in/Out'],
  },
  {
    match: /^\/manage\/rooms/,
    title: 'Quản lý phòng',
    breadcrumb: ['Nghiệp vụ', 'Phòng'],
  },
  {
    match: /^\/manage\/room-types/,
    title: 'Quản lý loại phòng',
    breadcrumb: ['Nghiệp vụ', 'Loại phòng'],
  },
  {
    match: /^\/manage\/services/,
    title: 'Quản lý dịch vụ',
    breadcrumb: ['Nghiệp vụ', 'Dịch vụ'],
  },
  {
    match: /^\/admin\/employees/,
    title: 'Quản lý nhân viên',
    breadcrumb: ['Quản trị', 'Nhân viên'],
  },
  {
    match: /^\/admin\/users/,
    title: 'Quản lý khách hàng',
    breadcrumb: ['Quản trị', 'Khách hàng'],
  },
  {
    match: /^\/admin\/reports/,
    title: 'Báo cáo hệ thống',
    breadcrumb: ['Quản trị', 'Báo cáo'],
  },
];

const resolveRouteMeta = (pathname) => {
  const matched = routeMeta.find((item) => item.match.test(pathname));
  if (matched) return matched;
  return {
    title: 'Bảng điều khiển',
    breadcrumb: ['Tổng quan'],
  };
};

const EMPTY_PASSWORD_FORM = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

const AdminLayout = () => {
  const { user, logout, isAdmin, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState(null);
  const [notificationData, setNotificationData] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    id_card: user?.id_card || '',
  });
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const notifRef = useRef(null);
  const profileMenuRef = useRef(null);

  const currentRoute = useMemo(
    () => resolveRouteMeta(location.pathname),
    [location.pathname],
  );

  const quickLinks = useMemo(
    () => navItems
      .filter((group) => !group.roles || group.roles.includes(user?.role))
      .flatMap((group) => group.items.map((item) => ({
        to: item.to,
        label: item.label,
      }))),
    [user?.role],
  );

  const rooms = stats?.rooms || {};
  const today = stats?.today || {};
  const pendingBookings = Number(stats?.pendingBookings || 0);
  const monthRevenue = Number(stats?.monthRevenue || 0);
  const occupancyRate = rooms.total > 0
    ? Math.round((Number(rooms.occupied || 0) / Number(rooms.total || 1)) * 100)
    : 0;

  const headerStats = useMemo(() => {
    if (isAdmin) {
      return [
        {
          label: 'Công suất phòng',
          value: `${occupancyRate}%`,
          tone: occupancyRate >= 90 ? 'danger' : occupancyRate >= 75 ? 'warning' : 'success',
        },
        {
          label: 'Doanh thu tháng',
          value: formatCurrency(monthRevenue),
          tone: 'info',
        },
        {
          label: 'Booking chờ',
          value: pendingBookings,
          tone: pendingBookings > 0 ? 'warning' : 'neutral',
        },
      ];
    }

    return [
      {
        label: 'Check-in hôm nay',
        value: Number(today.checkIns || 0),
        tone: 'success',
      },
      {
        label: 'Check-out hôm nay',
        value: Number(today.checkOuts || 0),
        tone: 'info',
      },
      {
        label: 'Phòng trống',
        value: Number(rooms.available || 0),
        tone: 'neutral',
      },
    ];
  }, [
    isAdmin,
    monthRevenue,
    occupancyRate,
    pendingBookings,
    rooms.available,
    today.checkIns,
    today.checkOuts,
  ]);

  const notifications = useMemo(
    () => Array.isArray(notificationData?.items) ? notificationData.items : [],
    [notificationData],
  );

  const alertCount = notifications.filter((item) => item.level === 'danger' || item.level === 'warning').length;

  useEffect(() => {
    const loadHeaderData = async () => {
      const [statsResult, notificationsResult] = await Promise.allSettled([
        reportService.dashboard(),
        reportService.notifications(),
      ]);

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value?.data?.stats || null);
      }

      if (notificationsResult.status === 'fulfilled') {
        setNotificationData(notificationsResult.value?.data?.notifications || null);
      }
    };

    loadHeaderData();
    const refreshId = window.setInterval(loadHeaderData, 60_000);
    return () => window.clearInterval(refreshId);
  }, []);

  useEffect(() => {
    const clockId = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(clockId);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setNotifOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      address: user?.address || '',
      id_card: user?.id_card || '',
    });
  }, [user]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const openProfileModal = () => {
    setProfileMenuOpen(false);
    setProfileModalOpen(true);
  };

  const openPasswordModal = () => {
    setProfileMenuOpen(false);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordModalOpen(true);
  };

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!profileForm.full_name?.trim()) {
      toast.error('Vui lòng nhập họ tên.');
      return;
    }

    if (!profileForm.phone?.trim()) {
      toast.error('Vui lòng nhập số điện thoại.');
      return;
    }

    setProfileSaving(true);
    try {
      const response = await userService.updateMe({
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address?.trim() || null,
        id_card: profileForm.id_card?.trim() || null,
      });
      updateUser(response?.data?.user || {});
      toast.success('Cập nhật thông tin thành công.');
      setProfileModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
    setProfileSaving(false);
  };

  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error('Vui lòng nhập đầy đủ thông tin đổi mật khẩu.');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setPasswordSaving(true);
    try {
      await authService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Đổi mật khẩu thành công.');
      setPasswordModalOpen(false);
      setPasswordForm(EMPTY_PASSWORD_FORM);
    } catch (error) {
      toast.error(error.message);
    }
    setPasswordSaving(false);
  };

  const handleQuickSearch = (event) => {
    event.preventDefault();

    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return;

    const matchedLink = quickLinks.find((item) => item.label.toLowerCase().includes(keyword));
    if (matchedLink) {
      navigate(matchedLink.to);
      setSearchText('');
      return;
    }

    if (/^#?\d+$/.test(keyword) || keyword.includes('book') || keyword.includes('đặt')) {
      navigate('/manage/bookings');
    } else if (keyword.includes('check')) {
      navigate('/manage/check-in-out');
    } else if (keyword.includes('room') || keyword.includes('phòng')) {
      navigate('/manage/rooms');
    } else if (keyword.includes('dịch vụ') || keyword.includes('service')) {
      navigate('/manage/services');
    } else if ((keyword.includes('nhân viên') || keyword.includes('employee')) && isAdmin) {
      navigate('/admin/employees');
    } else if ((keyword.includes('khách') || keyword.includes('user')) && isAdmin) {
      navigate('/admin/users');
    } else {
      navigate('/dashboard');
    }

    setSearchText('');
  };

  const dateText = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeText = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

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
          <div className="admin-header__top">
            <button className="admin-header__menu" onClick={() => setSidebarOpen(true)} aria-label="Mở menu"><FaBars /></button>

            <div className="admin-header__context">
              <p className="admin-header__context-sub">Khách sạn Sơn La · {isAdmin ? 'Quản trị viên' : 'Lễ tân trực ca'}</p>
              <h1 className="admin-header__title">{currentRoute.title}</h1>
              <div className="admin-header__meta">
                <span className="admin-header__breadcrumb">
                  {currentRoute.breadcrumb.map((segment, index) => (
                    <span key={`${segment}-${index}`}>
                      {index > 0 && <FaChevronRight size={10} />}
                      <span>{segment}</span>
                    </span>
                  ))}
                </span>
                <span className="admin-header__time"><FaClock /> {timeText} · {dateText}</span>
              </div>
            </div>
          </div>

          <div className="admin-header__actions-row">
            <form className="admin-header__search" onSubmit={handleQuickSearch}>
              <FaMagnifyingGlass />
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm nhanh: booking, phòng, check-in, nhân viên..."
                aria-label="Tìm kiếm nhanh"
              />
              <button type="submit">Đi</button>
            </form>

            <div className="admin-header__kpis">
              {headerStats.map((item) => (
                <div key={item.label} className={`admin-kpi admin-kpi--${item.tone}`}>
                  <span className="admin-kpi__label">{item.label}</span>
                  <strong className="admin-kpi__value">{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="admin-header__right">
              <NavLink to="/" className="admin-header__link"><FaGlobe /> Trang chủ</NavLink>

              <div className="admin-header__notif" ref={notifRef}>
                <button
                  className="admin-header__notif-btn"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  type="button"
                  aria-label="Thông báo"
                >
                  <FaBell />
                  {alertCount > 0 && <span className="admin-header__notif-badge">{alertCount}</span>}
                </button>

                {notifOpen && (
                  <div className="admin-header__notif-menu">
                    <p className="admin-header__notif-title">Thông báo vận hành</p>
                    {notifications.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`admin-header__notif-item admin-header__notif-item--${item.level}`}
                        onClick={() => navigate(item.to)}
                      >
                        <FaCircleExclamation />
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-header__profile" ref={profileMenuRef}>
                <button
                  type="button"
                  className="admin-header__user-pill"
                  title={user?.full_name || ''}
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                >
                  <span className="admin-header__user-avatar">{user?.full_name?.[0] || 'U'}</span>
                  <div>
                    <strong>{user?.full_name || 'Người dùng'}</strong>
                    <small>{isAdmin ? 'Admin' : 'Lễ tân'}</small>
                  </div>
                  <FaChevronDown size={12} />
                </button>

                {profileMenuOpen && (
                  <div className="admin-header__profile-menu">
                    <button type="button" onClick={openProfileModal}>Thông tin cá nhân</button>
                    <button type="button" onClick={openPasswordModal}>Đổi mật khẩu</button>
                    <button type="button" className="danger" onClick={handleLogout}>Đăng xuất</button>
                  </div>
                )}
              </div>

              <button className="admin-header__logout-btn" onClick={handleLogout}>Đăng xuất</button>
            </div>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Thông tin cá nhân"
        size="md"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setProfileModalOpen(false)}>Đóng</Button>
            <Button variant="primary" loading={profileSaving} onClick={handleSaveProfile}>Lưu thay đổi</Button>
          </>
        )}
      >
        <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: 10 }}>
          <Input label="Họ tên" name="full_name" value={profileForm.full_name} onChange={handleProfileFieldChange} required />
          <Input label="Email" name="email" value={profileForm.email} onChange={handleProfileFieldChange} disabled />
          <Input label="Số điện thoại" name="phone" value={profileForm.phone} onChange={handleProfileFieldChange} required />
          <Input label="Địa chỉ" name="address" value={profileForm.address} onChange={handleProfileFieldChange} />
          <Input label="CCCD" name="id_card" value={profileForm.id_card} onChange={handleProfileFieldChange} />
        </form>
      </Modal>

      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Đổi mật khẩu"
        size="md"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setPasswordModalOpen(false)}>Hủy</Button>
            <Button variant="primary" loading={passwordSaving} onClick={handleChangePassword}>Cập nhật mật khẩu</Button>
          </>
        )}
      >
        <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: 10 }}>
          <Input
            label="Mật khẩu hiện tại"
            name="current_password"
            type="password"
            value={passwordForm.current_password}
            onChange={handlePasswordFieldChange}
            required
          />
          <Input
            label="Mật khẩu mới"
            name="new_password"
            type="password"
            value={passwordForm.new_password}
            onChange={handlePasswordFieldChange}
            required
          />
          <Input
            label="Xác nhận mật khẩu mới"
            name="confirm_password"
            type="password"
            value={passwordForm.confirm_password}
            onChange={handlePasswordFieldChange}
            required
          />
        </form>
      </Modal>
    </div>
  );
};

export default AdminLayout;
