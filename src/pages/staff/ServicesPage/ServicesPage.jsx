import { useState, useEffect } from 'react';
import { FaCirclePlus } from 'react-icons/fa6';
import serviceService from '../../../services/service.service';
import Table from '../../../components/common/Table/Table';
import Pagination from '../../../components/common/Pagination/Pagination';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Input from '../../../components/common/Input/Input';
import PageHeader from '../../../components/common/PageHeader';
import Badge from '../../../components/common/Badge/Badge';
import { pickArray } from '../../../utils/apiData';
import { formatCurrency } from '../../../utils/formatters';
import { useAuth } from '../../../contexts/AuthContext';
import useToast from '../../../hooks/useToast';
import usePaginationQuery from '../../../hooks/usePaginationQuery';

const EMPTY = { service_name:'', price:'', description:'' };

const ServicesPage = () => {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const { page, limit, setPage, setLimit } = usePaginationQuery(1, 10);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await serviceService.getAll({ page, limit });
      const rows = pickArray(r?.data, ['services']);
      const apiPagination = r?.data?.pagination || {};

      setServices(rows);
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

  const openCreate = () => { setSelected(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (s) => { setSelected(s); setForm({ service_name:s.service_name, price:s.price, description:s.description||'' }); setModalOpen(true); };

  const handleChange = e => setForm(f=>({...f,[e.target.name]:e.target.value}));

  const handleSave = async e => {
    e.preventDefault();
    if (!form.service_name || !form.price) { toast.error('Vui lòng điền đầy đủ'); return; }
    setSaving(true);
    try {
      if (selected) await serviceService.update(selected.id, form);
      else await serviceService.create(form);
      toast.success('Lưu dịch vụ thành công'); setModalOpen(false); load();
    } catch(err){toast.error(err.message);}
    setSaving(false);
  };

  const handleToggle = async id => {
    try { await serviceService.toggle(id); toast.success('Đã cập nhật trạng thái'); load(); }
    catch(e){toast.error(e.message);}
  };

  const handleDelete = async id => {
    if(!window.confirm('Xóa dịch vụ này?')) return;
    try { await serviceService.delete(id); toast.success('Đã xóa'); load(); }
    catch(e){toast.error(e.message);}
  };

  const columns = [
    { key:'service_name', title:'Tên dịch vụ' },
    { key:'price', title:'Giá', render: v => formatCurrency(v) },
    { key:'description', title:'Mô tả', render: v => v||'—' },
    { key:'is_available', title:'Trạng thái', render: v => <Badge label={v ? 'Đang hoạt động' : 'Tạm dừng'} variant={v ? 'success' : 'warning'} /> },
    { key:'actions', title:'Hành động', render:(_,r)=>(
      <div style={{display:'flex',gap:6}}>
        <Button size="sm" variant="secondary" onClick={()=>openEdit(r)}>Sửa</Button>
        <Button size="sm" variant={r.is_available ? 'warning' : 'success'} onClick={()=>handleToggle(r.id)}>{r.is_available ? 'Dừng' : 'Kích hoạt'}</Button>
        {isAdmin&&<Button size="sm" variant="danger" onClick={()=>handleDelete(r.id)}>Xóa</Button>}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Quản lý dịch vụ" subtitle="Dịch vụ bổ sung cho khách lưu trú"
        actions={<Button variant="primary" icon={<FaCirclePlus color="#ffffff" />} onClick={openCreate}>Thêm dịch vụ</Button>} />
      <Table columns={columns} data={services} loading={loading} emptyText="Chưa có dịch vụ nào" />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={selected?'Sửa dịch vụ':'Thêm dịch vụ mới'} size="sm"
        footer={<><Button variant="secondary" onClick={()=>setModalOpen(false)}>Hủy</Button><Button variant="primary" loading={saving} onClick={handleSave}>Lưu</Button></>}>
        <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:14}}>
          <Input label="Tên dịch vụ" name="service_name" value={form.service_name} onChange={handleChange} required />
          <Input label="Giá (VNĐ)" name="price" type="number" value={form.price} onChange={handleChange} required min="0" />
          <div>
            <label style={{fontSize:'0.82rem',fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.02em'}}>Mô tả</label>
            <textarea name="description" value={form.description} onChange={handleChange} style={{width:'100%',marginTop:5,padding:'10px 14px',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',fontSize:'0.9rem',resize:'vertical',fontFamily:'var(--font-body)'}} rows={3} />
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ServicesPage;
