import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import AuthLayout from '../layouts/AuthLayout/AuthLayout';
import AdminLayout from '../layouts/AdminLayout/AdminLayout';
import MainLayout from '../layouts/MainLayout/MainLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage/ResetPasswordPage';

// Public Pages
import PaymentQrPage from '../pages/public/PaymentQrPage/PaymentQrPage';

// Customer Pages
import HomePage from '../pages/customer/HomePage/HomePage';
import RoomSearchPage from '../pages/customer/RoomSearchPage/RoomSearchPage';
import BookingPage from '../pages/customer/BookingPage/BookingPage';
import MyBookingsPage from '../pages/customer/MyBookingsPage/MyBookingsPage';
import ProfilePage from '../pages/customer/ProfilePage/ProfilePage';

// Staff Pages
import DashboardPage from '../pages/staff/DashboardPage/DashboardPage';
import BookingManagePage from '../pages/staff/BookingManagePage/BookingManagePage';
import RoomManagePage from '../pages/staff/RoomManagePage/RoomManagePage';
import CheckInOutPage from '../pages/staff/CheckInOutPage/CheckInOutPage';
import ServicesPage from '../pages/staff/ServicesPage/ServicesPage';
import RoomTypesPage from '../pages/staff/RoomTypesPage/RoomTypesPage';

// Admin Pages
import EmployeesPage from '../pages/admin/EmployeesPage/EmployeesPage';
import ReportsPage from '../pages/admin/ReportsPage/ReportsPage';
import UsersPage from '../pages/admin/UsersPage/UsersPage';

// Guards
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user?.role === 'customer') return <Navigate to="/" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const AppRouter = () => {
  return null; // handled via RouterProvider
};

const router = createBrowserRouter([
  // Public routes
  {
    path: '/payment-qr',
    element: <PaymentQrPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
      { path: '/register', element: <PublicRoute><RegisterPage /></PublicRoute> },
      { path: '/forgot-password', element: <PublicRoute><ForgotPasswordPage /></PublicRoute> },
      { path: '/reset-password', element: <PublicRoute><ResetPasswordPage /></PublicRoute> },
    ],
  },
  // Customer routes
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/rooms', element: <RoomSearchPage /> },
      { path: '/rooms/:id/book', element: <ProtectedRoute roles={['customer','receptionist','admin']}><BookingPage /></ProtectedRoute> },
      { path: '/my-bookings', element: <ProtectedRoute roles={['customer']}><MyBookingsPage /></ProtectedRoute> },
      { path: '/profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
    ],
  },
  // Staff + Admin routes
  {
    element: <ProtectedRoute roles={['receptionist','admin']}><AdminLayout /></ProtectedRoute>,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/manage/bookings', element: <BookingManagePage /> },
      { path: '/manage/rooms', element: <RoomManagePage /> },
      { path: '/manage/check-in-out', element: <CheckInOutPage /> },
      { path: '/manage/services', element: <ServicesPage /> },
      { path: '/manage/room-types', element: <RoomTypesPage /> },
      // Admin only
      { path: '/admin/employees', element: <ProtectedRoute roles={['admin']}><EmployeesPage /></ProtectedRoute> },
      { path: '/admin/reports', element: <ProtectedRoute roles={['admin']}><ReportsPage /></ProtectedRoute> },
      { path: '/admin/users', element: <ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;
