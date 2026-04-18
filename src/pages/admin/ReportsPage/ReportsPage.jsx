import { useState, useEffect } from 'react';
import { FaMagnifyingGlass, FaRotateRight } from 'react-icons/fa6';
import reportService from '../../../services/report.service';
import Spinner from '../../../components/common/Spinner/Spinner';
import PageHeader from '../../../components/common/PageHeader';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { pickArray, pickObject } from '../../../utils/apiData';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './ReportsPage.css';

const ReportsPage = () => {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ from: firstOfMonth, to: today });
  const [loading, setLoading] = useState(false);
  const [revenue, setRevenue] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [summary, setSummary] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [revRes, occRes, svcRes, sumRes] = await Promise.all([
        reportService.revenue({ ...dateRange, groupBy: 'day' }),
        reportService.occupancy(dateRange),
        reportService.topServices({ ...dateRange, limit: 5 }),
        reportService.bookingSummary(dateRange),
      ]);
      const revenueRows = pickArray(revRes?.data, ['rows']).map((row) => ({
        date: row.period || row.date,
        revenue: Number(row.total_revenue ?? row.revenue ?? row.total ?? 0),
        transaction_count: Number(row.transaction_count ?? 0),
      }));

      const occupancyPayload = pickObject(occRes?.data);
      const occupancyRows = pickArray(occupancyPayload, ['rows']);
      const occupancyRate = parseFloat(String(occupancyPayload.occupancyRate || '0').replace('%', ''));
      const normalizedOccupancy = occupancyRows.length > 0
        ? occupancyRows
        : [{ date: dateRange.to, occupancy_rate: Number.isFinite(occupancyRate) ? occupancyRate : 0 }];

      setRevenue(revenueRows);
      setOccupancy(normalizedOccupancy);
      setTopServices(pickArray(svcRes?.data, ['services']));
      setSummary(sumRes?.data || {});
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadReports(); }, []);

  const totalRevenue = revenue.reduce((s, r) => s + (r.revenue || r.total || 0), 0);
  const summaryByStatus = summary?.summary || {};

  return (
    <div className="reports-page">
      <PageHeader title="Báo cáo & Thống kê" subtitle="Phân tích doanh thu và hoạt động kinh doanh" />

      <div className="reports-page__filters">
        <div className="reports-filter-group">
          <label className="reports-filter-label">Từ ngày</label>
          <input type="date" value={dateRange.from} max={dateRange.to}
            onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))}
            className="reports-filter-input" />
        </div>
        <div className="reports-filter-group">
          <label className="reports-filter-label">Đến ngày</label>
          <input type="date" value={dateRange.to} min={dateRange.from} max={today}
            onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))}
            className="reports-filter-input" />
        </div>
        <button className="reports-filter-btn" onClick={loadReports} disabled={loading}>
          {loading ? <FaRotateRight className="reports-filter-btn__icon reports-filter-btn__icon--spin" /> : <FaMagnifyingGlass className="reports-filter-btn__icon" />} Xem báo cáo
        </button>
      </div>

      {loading ? <Spinner text="Đang tải báo cáo..." /> : (
        <>
          {/* Summary Cards */}
          <div className="reports-page__summary">
            <div className="report-stat">
              <p className="report-stat__label">Tổng doanh thu</p>
              <p className="report-stat__value">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="report-stat">
              <p className="report-stat__label">Tổng đặt phòng</p>
              <p className="report-stat__value">{summary?.total || 0}</p>
            </div>
            <div className="report-stat">
              <p className="report-stat__label">Đã hoàn thành</p>
              <p className="report-stat__value">{summaryByStatus['Completed'] || 0}</p>
            </div>
            <div className="report-stat">
              <p className="report-stat__label">Đã hủy</p>
              <p className="report-stat__value">{summaryByStatus['Cancelled'] || 0}</p>
            </div>
          </div>

          <div className="reports-page__charts">
            {/* Revenue Chart */}
            <div className="report-chart">
              <h3 className="report-chart__title">Doanh thu theo ngày</h3>
              {revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenue} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} />
                    <YAxis fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
                    <Tooltip formatter={v => [formatCurrency(v), 'Doanh thu']} />
                    <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4,4,0,0]} name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="report-chart__empty">Không có dữ liệu doanh thu</p>}
            </div>

            {/* Occupancy Chart */}
            <div className="report-chart">
              <h3 className="report-chart__title">Tỷ lệ lấp đầy (%)</h3>
              {occupancy.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={occupancy} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} />
                    <YAxis domain={[0,100]} fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} tickFormatter={v=>`${v}%`} />
                    <Tooltip formatter={v => [`${v}%`, 'Lấp đầy']} />
                    <Line type="monotone" dataKey="occupancy_rate" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Tỷ lệ lấp đầy" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="report-chart__empty">Không có dữ liệu lấp đầy</p>}
            </div>

            {/* Top Services */}
            <div className="report-chart">
              <h3 className="report-chart__title">Dịch vụ sử dụng nhiều nhất</h3>
              {topServices.length > 0 ? (
                <div className="report-services">
                  {topServices.map((s, i) => (
                    <div key={i} className="report-service-item">
                      <span className="report-service-item__rank">#{i+1}</span>
                      <span className="report-service-item__name">{s.service_name || s.name}</span>
                      <span className="report-service-item__count">{s.total_quantity || s.count || 0} lượt</span>
                      <span className="report-service-item__revenue">{formatCurrency(s.total_revenue || s.revenue || 0)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="report-chart__empty">Không có dữ liệu dịch vụ</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
