# 🏨 Khách Sạn Sơn La — Frontend

> ReactJS + Vite + React Router + Axios + Pure CSS (BEM)  
> Dựa trên tài liệu phân tích & thiết kế — Đại học Tây Bắc

---

## ⚙️ Yêu cầu

- Node.js >= 18.x
- npm >= 9.x
- Backend chạy tại `http://localhost:3000`

---

## 🚀 Chạy dự án

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
```bash
cp .env.example .env
# Mở .env và điều chỉnh VITE_API_URL nếu backend chạy ở port khác
```

### 3. Khởi động (Development)
```bash
npm run dev
```
Frontend chạy tại: **http://localhost:5173**

### 4. Build production
```bash
npm run build
npm run preview
```

---

## 👤 Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@khachsan-sonla.vn | password |
| Lễ tân | lan.letan@khachsan-sonla.vn | password |
| Khách hàng | Đăng ký mới tại `/register` | — |

---

## 📁 Cấu trúc thư mục

```
src/
├── assets/              # Tài nguyên tĩnh
├── components/
│   ├── common/          # Component tái sử dụng
│   │   ├── Badge/       # Badge trạng thái
│   │   ├── Button/      # Button đa biến thể
│   │   ├── Input/       # Input + Select
│   │   ├── Modal/       # Modal + ConfirmDialog
│   │   ├── Spinner/     # Loading spinner
│   │   ├── Table/       # Data table
│   │   ├── Card.jsx     # Card container
│   │   ├── PageHeader.jsx
│   │   └── StatusBadge.jsx
│   └── forms/
├── contexts/
│   └── AuthContext.jsx  # Auth state + JWT
├── hooks/
│   ├── useApi.js        # API call hook
│   ├── useToast.js      # Notification hook
│   └── useConfirm.js    # Confirm dialog hook
├── layouts/
│   ├── AuthLayout/      # Layout trang đăng nhập
│   ├── AdminLayout/     # Layout với sidebar (Staff/Admin)
│   └── MainLayout/      # Layout trang công khai
├── models/              # Định nghĩa dữ liệu
├── pages/
│   ├── auth/            # Login, Register
│   ├── customer/        # Home, RoomSearch, Booking, MyBookings, Profile
│   ├── staff/           # Dashboard, BookingManage, RoomManage, CheckInOut, Services, RoomTypes
│   └── admin/           # Employees, Reports, Users
├── router/              # React Router config + guards
├── services/            # Axios API calls (1 file/module)
├── styles/              # CSS global + variables
└── utils/               # Formatters, constants, validators
```

---

## 🛡️ Phân quyền

| Route | Khách | Lễ tân | Admin |
|-------|-------|--------|-------|
| `/` `/rooms` | ✅ | ✅ | ✅ |
| `/my-bookings` `/profile` | ✅ | — | — |
| `/dashboard` `/manage/*` | — | ✅ | ✅ |
| `/admin/*` | — | — | ✅ |

---

## 🔄 Luồng đặt phòng

```
Trang chủ → Tìm phòng → Chọn phòng → Đăng nhập (nếu chưa) → Xác nhận đặt phòng
→ [Staff] Xác nhận → Check-in → (Dịch vụ bổ sung) → Check-out → Hoàn thành
```
