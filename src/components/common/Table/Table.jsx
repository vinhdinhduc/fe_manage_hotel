import Spinner from '../Spinner/Spinner';
import './Table.css';

const Table = ({ columns, data, loading, emptyText = 'Không có dữ liệu', onRowClick }) => {
  if (loading) return <div className="table-loading"><Spinner text="Đang tải..." /></div>;

  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead className="table__head">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="table__th" style={{ width: col.width }}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table__body">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table__empty">{emptyText}</td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id || i}
                className={`table__row ${onRowClick ? 'table__row--clickable' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="table__td">
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
