import { useState, useEffect } from 'react';
import { FaCirclePlus } from 'react-icons/fa6';
import roomService from '../../../services/room.service';
import roomTypeService from '../../../services/roomType.service';
import Table from '../../../components/common/Table/Table';
import Pagination from '../../../components/common/Pagination/Pagination';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Input from '../../../components/common/Input/Input';
import PageHeader from '../../../components/common/PageHeader';
import { RoomStatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency } from '../../../utils/formatters';
import { pickArray, toArray } from '../../../utils/apiData';
import { ROOM_STATUS, ROOM_STATUS_LABELS } from '../../../utils/constants';
import { useAuth } from '../../../contexts/AuthContext';
import useToast from '../../../hooks/useToast';
import usePaginationQuery from '../../../hooks/usePaginationQuery';
import './RoomManagePage.css';

const EMPTY_FORM = { room_number: '', type_id: '', floor: '', status: 'Available', image_url: '', note: '' };

const normalizeImageUrl = (value) => String(value || '').trim();

const RoomManagePage = () => {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const { page, limit, setPage, setLimit } = usePaginationQuery(1, 10);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const getRoomId = (room) => room?.room_id ?? room?.id;

  const load = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(filterStatus ? { status: filterStatus } : {}),
      };
      const [roomRes, typeRes] = await Promise.all([
        roomService.getAll(params),
        roomTypeService.getAll({ page: 1, limit: 1000 }),
      ]);
      const rows = toArray(roomRes?.data);
      const apiPagination = roomRes?.pagination || {};

      setRooms(rows);
      setRoomTypes(pickArray(typeRes?.data, ['roomTypes']));
      setPagination({
        page: Number(apiPagination.page || page),
        totalPages: Number(apiPagination.totalPages || 1),
        total: Number(apiPagination.total || rows.length),
        limit: Number(apiPagination.limit || limit),
      });
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus, page, limit]);

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setSelectedImageName(''); setModalOpen(true); };
  const openEdit = (room) => { setSelected(room); setForm({ room_number: room.room_number, type_id: room.type_id, floor: room.floor, status: room.status, image_url: room.image_url || '', note: room.note || '' }); setSelectedImageName(''); setModalOpen(true); };
  const openStatus = (room) => { setSelected(room); setNewStatus(room.status); setStatusModalOpen(true); };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAdmin) {
      toast.error('Chỉ admin mới có quyền tải ảnh phòng.');
      event.target.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      const response = await roomService.uploadImage(file);
      const uploadedUrl = normalizeImageUrl(response?.data?.image_url);
      if (!uploadedUrl) {
        throw new Error('Không nhận được đường dẫn ảnh sau khi tải lên.');
      }

      setForm((prev) => ({ ...prev, image_url: uploadedUrl }));
      setSelectedImageName(file.name);
      toast.success('Tải ảnh lên thành công.');
    } catch (err) {
      toast.error(err.message);
    }
    setUploadingImage(false);
    event.target.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.room_number || !form.type_id || !form.floor) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    if (uploadingImage) { toast.error('Vui lòng chờ tải ảnh hoàn tất.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        image_url: normalizeImageUrl(form.image_url) || null,
      };

      if (selected) await roomService.update(getRoomId(selected), payload);
      else await roomService.create(payload);
      toast.success(selected ? 'Cập nhật phòng thành công' : 'Thêm phòng thành công');
      setModalOpen(false);
      setSelectedImageName('');
      load();
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await roomService.updateStatus(getRoomId(selected), newStatus);
      toast.success('Cập nhật trạng thái thành công');
      setStatusModalOpen(false); load();
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Xóa phòng ${room.room_number}?`)) return;
    try { await roomService.delete(getRoomId(room)); toast.success('Đã xóa phòng'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const columns = [
    { key: 'room_number', title: 'Số phòng', render: (v) => <strong>Phòng {v}</strong> },
    {
      key: 'image_url',
      title: 'Ảnh phòng',
      render: (v) => v ? (
        <img src={v} alt="Ảnh phòng" className="room-manage-page__thumbnail" />
      ) : (
        <span className="room-manage-page__thumbnail-empty">Chưa có ảnh</span>
      ),
    },
    { key: 'roomType', title: 'Loại phòng', render: (v) => v?.type_name || '—' },
    { key: 'floor', title: 'Tầng', render: (v) => `Tầng ${v}` },
    { key: 'roomType', title: 'Giá/đêm', render: (v) => formatCurrency(v?.base_price) },
    { key: 'status', title: 'Trạng thái', render: (v) => <RoomStatusBadge status={v} /> },
    { key: 'note', title: 'Ghi chú', render: (v) => v || '—' },
    { key: 'actions', title: 'Hành động', render: (_, row) => (
      <div style={{ display:'flex', gap:6 }}>
        <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>Sửa</Button>
        <Button size="sm" variant="ghost" onClick={() => openStatus(row)}>Trạng thái</Button>
        {isAdmin && <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>Xóa</Button>}
      </div>
    )},
  ];

  return (
    <div className="room-manage-page">
      <PageHeader title="Quản lý phòng" subtitle="Thêm, sửa và cập nhật trạng thái phòng"
        actions={<Button variant="primary" icon={<FaCirclePlus color="#ffffff" />} onClick={openCreate}>Thêm phòng</Button>} />

      <div className="room-manage-page__filters">
        <button className={`bm-filter-btn ${!filterStatus ? 'bm-filter-btn--active' : ''}`} onClick={() => { setFilterStatus(''); setPage(1); }}>Tất cả</button>
        {Object.entries(ROOM_STATUS).map(([, v]) => (
          <button key={v} className={`bm-filter-btn ${filterStatus === v ? 'bm-filter-btn--active' : ''}`} onClick={() => { setFilterStatus(v); setPage(1); }}>{ROOM_STATUS_LABELS[v]}</button>
        ))}
      </div>

      <Table columns={columns} data={rooms} loading={loading} emptyText="Chưa có phòng nào" />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Sửa thông tin phòng' : 'Thêm phòng mới'} size="sm"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button><Button variant="primary" loading={saving} onClick={handleSave}>{selected ? 'Lưu thay đổi' : 'Thêm phòng'}</Button></>}>
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="Số phòng" name="room_number" value={form.room_number} onChange={handleChange} required placeholder="101" />
            <Input label="Tầng" name="floor" type="number" value={form.floor} onChange={handleChange} required placeholder="1" min="1" />
          </div>
          <div>
            <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.02em' }}>Loại phòng *</label>
            <select name="type_id" value={form.type_id} onChange={handleChange} required style={{ width:'100%',padding:'10px 14px',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',marginTop:5,fontSize:'0.9rem' }}>
              <option value="">— Chọn loại phòng —</option>
              {roomTypes.map(t => <option key={t.type_id ?? t.id} value={t.type_id ?? t.id}>{t.type_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.02em' }}>Trạng thái</label>
            <select name="status" value={form.status} onChange={handleChange} style={{ width:'100%',padding:'10px 14px',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',marginTop:5,fontSize:'0.9rem' }}>
              {Object.entries(ROOM_STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="room-manage-page__upload-box">
            <label className="room-manage-page__upload-label">Ảnh phòng</label>
            {isAdmin ? (
              <>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageFileChange}
                  disabled={uploadingImage}
                  className="room-manage-page__upload-input"
                />
                <p className="room-manage-page__upload-hint">
                  Hỗ trợ JPG, PNG, WEBP (tối đa 5MB).
                  {selectedImageName ? ` Đã chọn: ${selectedImageName}` : ''}
                </p>
              </>
            ) : (
              <p className="room-manage-page__upload-hint">Chỉ admin có quyền tải ảnh.</p>
            )}
          </div>
          {form.image_url ? (
            <div className="room-manage-page__preview-wrap">
              <img src={form.image_url} alt="Xem trước ảnh phòng" className="room-manage-page__preview" />
              {isAdmin ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, image_url: '' }));
                    setSelectedImageName('');
                  }}
                >
                  Xóa ảnh
                </Button>
              ) : null}
            </div>
          ) : null}
          <Input label="Ghi chú" name="note" value={form.note} onChange={handleChange} placeholder="Ghi chú thêm (tùy chọn)" />
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} title={`Cập nhật trạng thái — Phòng ${selected?.room_number}`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setStatusModalOpen(false)}>Hủy</Button><Button variant="primary" loading={saving} onClick={handleStatusUpdate}>Cập nhật</Button></>}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {Object.entries(ROOM_STATUS_LABELS).map(([v, l]) => (
            <label key={v} className={`room-status-option ${newStatus===v?'room-status-option--active':''}`}>
              <input type="radio" checked={newStatus===v} onChange={() => setNewStatus(v)} />
              <span>{l}</span>
              <RoomStatusBadge status={v} />
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default RoomManagePage;
