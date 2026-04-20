import { useState, useEffect } from 'react';
import { FaCirclePlus } from 'react-icons/fa6';
import roomTypeService from '../../../services/roomType.service';
import Table from '../../../components/common/Table/Table';
import Pagination from '../../../components/common/Pagination/Pagination';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Input from '../../../components/common/Input/Input';
import PageHeader from '../../../components/common/PageHeader';
import { pickArray } from '../../../utils/apiData';
import { formatCurrency } from '../../../utils/formatters';
import { useAuth } from '../../../contexts/AuthContext';
import useToast from '../../../hooks/useToast';
import usePaginationQuery from '../../../hooks/usePaginationQuery';

const EMPTY = { type_name:'', base_price:'', max_occupancy:2, amenities:'', description:'' };

const normalizeAmenitiesInput = (amenities) => {
  if (Array.isArray(amenities)) return amenities.join(', ');
  return amenities || '';
};

const normalizeAmenitiesForSubmit = (amenities) => {
  if (!amenities) return [];
  if (Array.isArray(amenities)) return amenities;
  return amenities
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const RoomTypesPage = () => {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const { page, limit, setPage, setLimit } = usePaginationQuery(1, 10);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await roomTypeService.getAll({ page, limit });
      const rows = pickArray(r?.data, ['roomTypes']);
      const apiPagination = r?.data?.pagination || {};

      setTypes(rows);
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
  const openEdit = t => { setSelected(t); setForm({ type_name:t.type_name, base_price:t.base_price, max_occupancy:t.max_occupancy, amenities:normalizeAmenitiesInput(t.amenities), description:t.description||'' }); setModalOpen(true); };
  const handleChange = e => setForm(f=>({...f,[e.target.name]:e.target.value}));
  const handleSave = async e => {
    e.preventDefault();
    if (!form.type_name||!form.base_price) { toast.error('Vui lòng điền đầy đủ'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amenities: normalizeAmenitiesForSubmit(form.amenities),
      };

      if(selected) await roomTypeService.update(selected.type_id, payload);
      else await roomTypeService.create(payload);
      toast.success('Lưu thành công'); setModalOpen(false); load();
    } catch(err){toast.error(err.message);}
    setSaving(false);
  };
  const handleDelete = async id => {
    if(!window.confirm('Xóa loại phòng này?')) return;
    try { await roomTypeService.delete(id); toast.success('Đã xóa'); load(); } catch(e){toast.error(e.message);}
  };

  const columns = [
    { key:'type_name', title:'Loại phòng', render:v=><strong>{v}</strong> },
    { key:'base_price', title:'Giá/đêm', render:v=>formatCurrency(v) },
    { key:'max_occupancy', title:'Sức chứa', render:v=>`${v} người` },
    {
      key:'amenities',
      title:'Tiện nghi',
      render:(v)=>{
        const text = Array.isArray(v) ? v.join(', ') : (v || '');
        return text ? text.slice(0,50)+(text.length>50?'...':'') : '—';
      }
    },
    { key:'actions', title:'Hành động', render:(_,r)=>(
      <div style={{display:'flex',gap:6}}>
        <Button size="sm" variant="secondary" onClick={()=>openEdit(r)}>Sửa</Button>
        {isAdmin&&<Button size="sm" variant="danger" onClick={()=>handleDelete(r.type_id ?? r.id)}>Xóa</Button>}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Loại phòng" subtitle="Quản lý các loại phòng và giá"
        actions={<Button variant="primary" icon={<FaCirclePlus color="#ffffff" />} onClick={openCreate}>Thêm loại phòng</Button>} />
      <Table columns={columns} data={types} loading={loading} emptyText="Chưa có loại phòng nào" />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={selected?'Sửa loại phòng':'Thêm loại phòng mới'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setModalOpen(false)}>Hủy</Button><Button variant="primary" loading={saving} onClick={handleSave}>Lưu</Button></>}>
        <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Input label="Tên loại phòng" name="type_name" value={form.type_name} onChange={handleChange} required />
            <Input label="Giá/đêm (VNĐ)" name="base_price" type="number" value={form.base_price} onChange={handleChange} required min="0" />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
            <Input label="Sức chứa (người)" name="max_occupancy" type="number" value={form.max_occupancy} onChange={handleChange} min="1" />
          </div>
          <Input label="Tiện nghi" name="amenities" value={form.amenities} onChange={handleChange} placeholder="WiFi, điều hòa, TV, bồn tắm..." />
          <div>
            <label style={{fontSize:'0.82rem',fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.02em'}}>Mô tả</label>
            <textarea name="description" value={form.description} onChange={handleChange} style={{width:'100%',marginTop:5,padding:'10px 14px',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',fontSize:'0.9rem',resize:'vertical',fontFamily:'var(--font-body)'}} rows={3} />
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default RoomTypesPage;
