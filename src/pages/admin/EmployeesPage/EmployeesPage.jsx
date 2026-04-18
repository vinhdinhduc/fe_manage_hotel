import { useState, useEffect } from 'react';
import { FaUserPlus } from 'react-icons/fa6';
import employeeService from '../../../services/employee.service';
import Table from '../../../components/common/Table/Table';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Input from '../../../components/common/Input/Input';
import PageHeader from '../../../components/common/PageHeader';
import Badge from '../../../components/common/Badge/Badge';
import { toArray } from '../../../utils/apiData';
import useToast from '../../../hooks/useToast';

const EMPTY = { full_name:'', email:'', phone:'', password:'', role:'receptionist', position:'Nhân viên lễ tân', department:'Lễ tân', hire_date:'', salary:'', shift:'Sáng' };

const EmployeesPage = () => {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const r = await employeeService.getAll(); setEmployees(toArray(r?.data)); } catch(e){toast.error(e.message);} setLoading(false); };
  useEffect(()=>{load();},[]);

  const openCreate = () => { setSelected(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = e => {
    setSelected(e);
    setForm({ full_name:e.User?.full_name||'', email:e.User?.email||'', phone:e.User?.phone||'', password:'', role:e.User?.role||'receptionist', position:e.position||'', department:e.department||'', hire_date:e.hire_date?.split('T')[0]||'', salary:e.salary||'', shift:e.shift||'Sáng' });
    setModalOpen(true);
  };

  const handleChange = e => setForm(f=>({...f,[e.target.name]:e.target.value}));

  const handleSave = async ev => {
    ev.preventDefault();
    if (!form.full_name||!form.email||(!selected&&!form.password)) { toast.error('Vui lòng điền đầy đủ thông tin bắt buộc'); return; }
    setSaving(true);
    try {
      if(selected) await employeeService.update(selected.id, form);
      else await employeeService.create(form);
      toast.success('Lưu nhân viên thành công'); setModalOpen(false); load();
    } catch(err){toast.error(err.message);}
    setSaving(false);
  };

  const handleToggle = async emp => {
    try { await employeeService.toggleActive(emp.id); toast.success('Cập nhật trạng thái thành công'); load(); }
    catch(e){toast.error(e.message);}
  };

  const columns = [
    { key:'User', title:'Họ tên', render:v=><strong>{v?.full_name}</strong> },
    { key:'User', title:'Email', render:v=>v?.email },
    { key:'User', title:'SĐT', render:v=>v?.phone||'—' },
    { key:'position', title:'Chức vụ' },
    { key:'department', title:'Bộ phận' },
    { key:'shift', title:'Ca làm' },
    { key:'User', title:'Trạng thái', render:v=><Badge label={v?.is_active?'Đang làm':'Nghỉ việc'} variant={v?.is_active?'success':'danger'} /> },
    { key:'actions', title:'Hành động', render:(_,r)=>(
      <div style={{display:'flex',gap:6}}>
        <Button size="sm" variant="secondary" onClick={()=>openEdit(r)}>Sửa</Button>
        <Button size="sm" variant={r.User?.is_active?'danger':'success'} onClick={()=>handleToggle(r)}>{r.User?.is_active?'Khóa':'Mở'}</Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Quản lý nhân viên" subtitle="Thêm và quản lý tài khoản nhân viên"
        actions={<Button variant="primary" icon={<FaUserPlus color="#ffffff" />} onClick={openCreate}>Thêm nhân viên</Button>} />
      <Table columns={columns} data={employees} loading={loading} emptyText="Chưa có nhân viên nào" />
      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={selected?'Sửa thông tin nhân viên':'Thêm nhân viên mới'} size="lg"
        footer={<><Button variant="secondary" onClick={()=>setModalOpen(false)}>Hủy</Button><Button variant="primary" loading={saving} onClick={handleSave}>Lưu</Button></>}>
        <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Input label="Họ tên *" name="full_name" value={form.full_name} onChange={handleChange} required />
            <Input label="Email *" name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Input label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} />
            <Input label={selected?'Mật khẩu mới (để trống = không đổi)':'Mật khẩu *'} name="password" type="password" value={form.password} onChange={handleChange} required={!selected} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <div>
              <label style={{fontSize:'0.82rem',fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.02em'}}>Vai trò</label>
              <select name="role" value={form.role} onChange={handleChange} style={{width:'100%',padding:'10px 14px',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',marginTop:5,fontSize:'0.9rem'}}>
                <option value="receptionist">Lễ tân</option>
                <option value="admin">Quản lý</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:'0.82rem',fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.02em'}}>Ca làm</label>
              <select name="shift" value={form.shift} onChange={handleChange} style={{width:'100%',padding:'10px 14px',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',marginTop:5,fontSize:'0.9rem'}}>
                {['Sáng','Chiều','Tối','Full-time'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="Lương (VNĐ)" name="salary" type="number" value={form.salary} onChange={handleChange} min="0" />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <Input label="Chức vụ" name="position" value={form.position} onChange={handleChange} />
            <Input label="Bộ phận" name="department" value={form.department} onChange={handleChange} />
            <Input label="Ngày vào làm" name="hire_date" type="date" value={form.hire_date} onChange={handleChange} />
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default EmployeesPage;
