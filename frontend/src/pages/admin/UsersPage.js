import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import styles from "../../css/UsersPage.module.css";

const ROLES = [
  { value: "", label: "Tất cả" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "customer", label: "Customer" },
];

function roleBadgeClass(role) {
  if (role === "admin")    return styles.badgeAdmin;
  if (role === "staff")    return styles.badgeStaff;
  if (role === "customer") return styles.badgeCustomer;
  return "";
}

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    email:     user?.email     || "",
    full_name: user?.full_name || "",
    phone:     user?.phone     || "",
    role:      user?.role      || "customer",
    password:  "",
    is_active: user?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = e => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [e.target.name]: val }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (isEdit) {
        const { password, email, ...data } = form;
        await api.patch(`/users/${user.id}/`, data);
      } else {
        await api.post("/users/", form);
      }
      onSaved(); onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra.");
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayBg} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{isEdit ? "Chỉnh sửa user" : "Tạo tài khoản mới"}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.error}>{error}</div>}
            {!isEdit && (
              <div className={styles.field}>
                <label className={styles.label}>Email *</label>
                <input className={styles.input} type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
            )}
            <div className={styles.field}>
              <label className={styles.label}>Họ tên *</label>
              <input className={styles.input} type="text" name="full_name" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Số điện thoại</label>
              <input className={styles.input} type="text" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Role *</label>
              <select className={styles.select} name="role" value={form.role} onChange={handleChange}>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            {!isEdit && (
              <div className={styles.field}>
                <label className={styles.label}>Mật khẩu *</label>
                <input className={styles.input} type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} />
              </div>
            )}
            {isEdit && (
              <label className={styles.checkboxLabel}>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
                Tài khoản đang hoạt động
              </label>
            )}
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>Huỷ</button>
              <button type="submit" disabled={loading} className={styles.confirmBtn}>
                {loading && <div className={styles.spinner} style={{width:16,height:16,borderWidth:2}} />}
                {isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/users/${user.id}/reset-password/`);
      setResult(res.data);
    } catch { setResult({ error: "Không thể reset mật khẩu." }); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayBg} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Reset mật khẩu</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          {!result ? (
            <>
              <p style={{fontSize:13, color:"#94a3b8"}}>
                Reset mật khẩu cho <strong style={{color:"#fff"}}>{user.full_name}</strong>? Hệ thống sẽ tạo mật khẩu tạm thời.
              </p>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={onClose}>Huỷ</button>
                <button className={`${styles.confirmBtn} ${styles.red}`} onClick={handleReset} disabled={loading}>
                  {loading && <div className={styles.spinner} style={{width:16,height:16,borderWidth:2}} />}
                  Xác nhận
                </button>
              </div>
            </>
          ) : result.error ? (
            <>
              <div className={styles.error}>{result.error}</div>
              <button className={styles.fullBtn} onClick={onClose}>Đóng</button>
            </>
          ) : (
            <>
              <p style={{fontSize:13, color:"#94a3b8"}}>Mật khẩu tạm thời:</p>
              <div className={styles.tempPassBox}>{result.temp_password}</div>
              <p className={styles.tempPassNote}>Yêu cầu user đổi mật khẩu ngay sau khi đăng nhập.</p>
              <button className={styles.fullBtn} onClick={onClose}>Đóng</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modal, setModal]           = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)     params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      const res = await api.get(`/users/?${params}`);
      setUsers(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const handleDeactivate = async (user) => {
    if (!window.confirm(`Vô hiệu hoá tài khoản "${user.full_name}"?`)) return;
    await api.delete(`/users/${user.id}/`);
    fetchUsers();
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Quản lý User</h1>
            <p>Tạo, chỉnh sửa và phân quyền tài khoản</p>
          </div>
          <button className={styles.createBtn} onClick={() => setModal({ type: "create" })}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tạo tài khoản
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input className={styles.searchInput} type="text" value={search}
              onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, email..." />
          </div>
          <div className={styles.roleFilters}>
            {ROLES.map(r => (
              <button key={r.value}
                className={`${styles.filterBtn} ${roleFilter === r.value ? styles.active : ""}`}
                onClick={() => setRoleFilter(r.value)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Role</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className={styles.tableCenter}><div className={styles.spinner} /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className={styles.tableCenter}>Không có kết quả</td></tr>
              ) : users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>{user.full_name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className={styles.userName}>{user.full_name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${roleBadgeClass(user.role)}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${user.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                      {user.is_active ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className={styles.dateText}>{new Date(user.date_joined).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Chỉnh sửa" onClick={() => setModal({ type: "edit", user })}>
                        <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                      </button>
                      <button className={`${styles.actionBtn} ${styles.warn}`} title="Reset mật khẩu" onClick={() => setModal({ type: "reset", user })}>
                        <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                      </button>
                      {user.is_active && (
                        <button className={`${styles.actionBtn} ${styles.danger}`} title="Vô hiệu hoá" onClick={() => handleDeactivate(user)}>
                          <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.tableFooter}>{users.length} kết quả</p>
      </div>

      {modal?.type === "create" && <UserModal onClose={() => setModal(null)} onSaved={fetchUsers} />}
      {modal?.type === "edit"   && <UserModal user={modal.user} onClose={() => setModal(null)} onSaved={fetchUsers} />}
      {modal?.type === "reset"  && <ResetPasswordModal user={modal.user} onClose={() => setModal(null)} />}
    </AdminLayout>
  );
}