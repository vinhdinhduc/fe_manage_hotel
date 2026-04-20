import React from 'react';
import './Pagination.css';

const Pagination = ({
  page,
  totalPages,
  limit,
  total,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const canPrev = safePage > 1;
  const canNext = safePage < safeTotalPages;
  const pageNumbers = [];
  for (let i = Math.max(1, safePage - 2); i <= Math.min(safeTotalPages, safePage + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination">
      <button className="pagination__btn" disabled={!canPrev} onClick={() => onPageChange(safePage - 1)}>
        &laquo; Trước
      </button>
      {pageNumbers.map((p) => (
        <button
          key={p}
          className={`pagination__btn${p === safePage ? ' pagination__btn--active' : ''}`}
          onClick={() => onPageChange(p)}
          disabled={p === safePage}
        >
          {p}
        </button>
      ))}
      <button className="pagination__btn" disabled={!canNext} onClick={() => onPageChange(safePage + 1)}>
        Sau &raquo;
      </button>
      <span className="pagination__info">
        Trang {safePage}/{safeTotalPages} &nbsp;|&nbsp; Tổng: {total}
      </span>
      <select
        className="pagination__limit"
        value={limit}
        onChange={e => onLimitChange(Number(e.target.value))}
      >
        {limitOptions.map((n) => (
          <option key={n} value={n}>{n}/trang</option>
        ))}
      </select>
    </div>
  );
};

export default Pagination;
