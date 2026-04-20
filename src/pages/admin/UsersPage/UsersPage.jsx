import { useState, useEffect } from 'react';
import userService from '../../../services/user.service';
import Table from '../../../components/common/Table/Table';
import Pagination from '../../../components/common/Pagination/Pagination';
import Button from '../../../components/common/Button/Button';
import PageHeader from '../../../components/common/PageHeader';
import Badge from '../../../components/common/Badge/Badge';
import { toArray } from '../../../utils/apiData';
import { formatDate } from '../../../utils/formatters';
import useToast from '../../../hooks/useToast';
import usePaginationQuery from '../../../hooks/usePaginationQuery';

const UsersPage = () => {
  const toast = useToast();
  const { page, limit, setPage, setLimit } = usePaginationQuery(1, 10);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });

  const load = async () => {
    setLoading(true);
    try {
      const r = await userService.getAll({ page, limit });
      const rows = toArray(r?.data);
      const apiPagination = r?.pagination || {};

      setUsers(rows);
      setPagination({
        page: Number(apiPagination.page || page),
        totalPages: Number(apiPagination.totalPages || 1),
        total: Number(apiPagination.total || rows.length),
        limit: Number(apiPagination.limit || limit),
      });
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [page, limit]);

  const handleToggle = async id => {
    try { await userService.toggleActive(id); toast.success('Cập nhật thành công'); load(); }
    catch(e){toast.error(e.message);}
  };

  const roleLabels = { admin:'Quản lý', receptionist:'Lễ tân', customer:'Khách hàng' };
  const roleVariants = { admin:'danger', receptionist:'info', customer:'success' };

  const columns = [
    { key:'full_name', title:'Họ tên' },
    { key:'email', title:'Email' },
    { key:'phone', title:'Số điện thoại', render:v=>v||'—' },
    { key:'role', title:'Vai trò', render:v=><Badge label={roleLabels[v]||v} variant={roleVariants[v]||'default'} /> },
    { key:'created_at', title:'Ngày đăng ký', render:v=>formatDate(v) },
    { key:'is_active', title:'Trạng thái', render:v=><Badge label={v?'Đang hoạt động':'Đã khóa'} variant={v?'success':'danger'} /> },
    { key:'actions', title:'Hành động', render:(_,r)=>(
      <Button size="sm" variant={r.is_active?'danger':'success'} onClick={()=>handleToggle(r.id)}>
        {r.is_active?'Khóa':'Mở khóa'}
      </Button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Quản lý khách hàng" subtitle="Danh sách tài khoản người dùng hệ thống" />
      <Table columns={columns} data={users} loading={loading} emptyText="Không có người dùng nào" />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  );
};
export default UsersPage;
