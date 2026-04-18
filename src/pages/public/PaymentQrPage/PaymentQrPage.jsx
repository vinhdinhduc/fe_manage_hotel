import { useMemo } from 'react';
import { FaArrowRight, FaClipboardCheck, FaQrcode, FaWallet } from 'react-icons/fa6';
import { useSearchParams } from 'react-router-dom';
import { BANK_TRANSFER_INFO } from '../../../utils/constants';
import { formatCurrency } from '../../../utils/formatters';
import './PaymentQrPage.css';

const PaymentQrPage = () => {
  const [searchParams] = useSearchParams();

  const payment = useMemo(() => {
    const bookingId = searchParams.get('bookingId') || '';
    const amount = Number(searchParams.get('amount') || 0);
    const note = searchParams.get('note') || `${BANK_TRANSFER_INFO.transferPrefix} ${bookingId}`.trim();
    return {
      bookingId,
      amount,
      note,
      bankName: searchParams.get('bankName') || BANK_TRANSFER_INFO.bankName,
      bankCode: searchParams.get('bankCode') || BANK_TRANSFER_INFO.bankCode,
      accountNumber: searchParams.get('accountNumber') || BANK_TRANSFER_INFO.accountNumber,
      accountName: searchParams.get('accountName') || BANK_TRANSFER_INFO.accountName,
    };
  }, [searchParams]);

  const transferContent = [
    `NGAN_HANG:${payment.bankName}`,
    `BANK_CODE:${payment.bankCode}`,
    `SO_TAI_KHOAN:${payment.accountNumber}`,
    `CHU_TAI_KHOAN:${payment.accountName}`,
    `SO_TIEN:${Math.round(payment.amount)}`,
    `NOI_DUNG:${payment.note}`,
  ].join('\n');

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (_) {}
  };

  return (
    <div className="payment-qr-page">
      <div className="payment-qr-page__shell">
        <div className="payment-qr-page__hero">
          <div className="payment-qr-page__eyebrow"><FaQrcode /> Thanh toán chuyển khoản</div>
          <h1 className="payment-qr-page__title">Quét mã để xem thông tin thanh toán</h1>
          <p className="payment-qr-page__subtitle">
            Mã QR này dẫn tới trang thanh toán công khai, hiển thị rõ số tiền, ngân hàng và nội dung chuyển khoản cho booking.
          </p>
        </div>

        <div className="payment-qr-page__grid">
          <section className="payment-qr-page__card payment-qr-page__card--qr">
            <div className="payment-qr-page__card-head">
              <span><FaQrcode /> Mã QR</span>
              <button type="button" className="payment-qr-page__copy-btn" onClick={() => handleCopy(window.location.href)}>Copy link</button>
            </div>
            <div className="payment-qr-page__qr-badge">
              <FaWallet /> Booking #{payment.bookingId || '—'}
            </div>
            <div className="payment-qr-page__amount">{formatCurrency(payment.amount || 0)}</div>
            <div className="payment-qr-page__hint">Nội dung chuyển khoản: <strong>{payment.note}</strong></div>
            <div className="payment-qr-page__code-box">
              <code>{transferContent}</code>
              <button type="button" className="payment-qr-page__copy-inline" onClick={() => handleCopy(transferContent)}>
                <FaClipboardCheck /> Sao chép nội dung
              </button>
            </div>
          </section>

          <section className="payment-qr-page__card payment-qr-page__card--info">
            <div className="payment-qr-page__card-head">
              <span><FaArrowRight /> Thông tin ngân hàng</span>
            </div>
            <div className="payment-qr-page__info-list">
              <div className="payment-qr-page__info-row"><span>Ngân hàng</span><strong>{payment.bankName}</strong></div>
              <div className="payment-qr-page__info-row"><span>Mã ngân hàng</span><strong>{payment.bankCode}</strong></div>
              <div className="payment-qr-page__info-row"><span>Số tài khoản</span><strong>{payment.accountNumber}</strong></div>
              <div className="payment-qr-page__info-row"><span>Chủ tài khoản</span><strong>{payment.accountName}</strong></div>
              <div className="payment-qr-page__info-row"><span>Số tiền</span><strong>{formatCurrency(payment.amount || 0)}</strong></div>
              <div className="payment-qr-page__info-row"><span>Nội dung CK</span><strong>{payment.note}</strong></div>
            </div>
            <div className="payment-qr-page__note">
              Nếu bạn đang ở khách sạn, vui lòng gửi màn hình này cho lễ tân để đối chiếu nhanh hơn.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PaymentQrPage;