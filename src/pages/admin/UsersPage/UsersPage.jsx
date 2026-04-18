import { useState, useEffect } from 'react';
import userService from '../../../services/user.service';
import Table from '../../../components/common/Table/Table';
import Button from '../../../components/common/Button/Button';
import PageHeader from '../../../components/common/PageHeader';
import Badge from '../../../components/common/Badge/Badge';
import { toArray } from '../../../utils/apiData';
import { formatDate } from '../../../utils/formatters';
import useToast from '../../../hooks/useToast';

const UsersPage = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); try { const r = await userService.getAll(); setUsers(toArray(r?.data)); } catch(e){toast.error(e.message);} setLoading(false); };
  useEffect(()=>{load();},[]);

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
    </div>
  );
};
export default UsersPage;
