export const ROLES = {
  ADMIN: "admin",
  RECEPTIONIST: "receptionist",
  CUSTOMER: "customer",
};

export const ROOM_STATUS = {
  AVAILABLE: "Available",
  BOOKED: "Booked",
  OCCUPIED: "Occupied",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
};

export const BOOKING_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked-in",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PAYMENT_METHODS = [
  { value: "Cash", label: "Tiền mặt" },
  { value: "BankTransfer", label: "Chuyển khoản" },
];

export const BANK_TRANSFER_INFO = {
  bankCode: import.meta.env.VITE_BANK_CODE || "mbbank",
  bankName: import.meta.env.VITE_BANK_NAME || "MB Bank",
  accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER || "0000000000",
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || "KHACH SAN SON LA",
  transferPrefix: import.meta.env.VITE_BANK_TRANSFER_PREFIX || "DP",
};

export const ROOM_STATUS_LABELS = {
  Available: "Trống",
  Booked: "Đã đặt",
  Occupied: "Đang ở",
  Cleaning: "Đang dọn",
  Maintenance: "Bảo trì",
};

export const BOOKING_STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  "Checked-in": "Đang lưu trú",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};
