import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import styles from "../../css/Customerspage.module.css";

const STATUS_CONTRACT = {
  pending:   { label: "Chờ duyệt",    cls: "badgeYellow" },
  active:    { label: "Hiệu lực",     cls: "badgeActive"  },
  expired:   { label: "Hết hạn",      cls: "badgeInactive" },
  cancelled: { label: "Đã huỷ",       cls: "badgeInactive" },
  rejected:  { label: "Từ chối",      cls: "badgeRed" },
};

// ── Customer Detail Modal ─────────────────────────────────────
function CustomerDetailModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    date_of_birth: profile.date_of_birth || "",
    gender:        profile.gender        || "",
    address:       profile.address       || "",
    city:          profile.city          || "",
    id_number:     profile.id_number     || "",
    occupation:    profile.occupation    || "",
    note:          profile.note          || "",
  });
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState(null);

  useEffect(() => {
    api.get(`customer/contracts/?customer=${profile.user}`).then(res => setContracts(res.data.results ?? res.data));
  }, [profile.user]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setMsg(null);
    try {
      await api.put(`manage/customers/${profile.id}/`, form);
      setMsg({ type: "ok", text: "Cập nhật thành công." });
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      setMsg({ type: "err", text: typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra." });
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayBg} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Chi tiết khách hàng — {profile.user_name}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {msg && <div className={msg.type === "ok" ? styles.alertOk : styles.alertErr}>{msg.text}</div>}

            {/* Thông tin cơ bản (readonly) */}
            <p className={styles.sectionTitle}>Thông tin tài khoản</p>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Họ tên</label>
                <input className={styles.inputDisabled} value={profile.user_name} disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input className={styles.inputDisabled} value={profile.user_email} disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Số điện thoại</label>
                <input className={styles.inputDisabled} value={profile.user_phone || "—"} disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Trạng thái</label>
                <input className={styles.inputDisabled} value={profile.user_is_active ? "Hoạt động" : "Vô hiệu"} disabled />
              </div>
            </div>

            {/* Thông tin cá nhân (editable) */}
            <p className={styles.sectionTitle}>Thông tin cá nhân</p>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Ngày sinh</label>
                <input className={styles.input} type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Giới tính</label>
                <select className={styles.select} name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">-- Chọn --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>CCCD/CMND</label>
                <input className={styles.input} name="id_number" value={form.id_number} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Nghề nghiệp</label>
                <input className={styles.input} name="occupation" value={form.occupation} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Thành phố</label>
                <input className={styles.input} name="city" value={form.city} onChange={handleChange} />
              </div>
              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.label}>Địa chỉ</label>
                <input className={styles.input} name="address" value={form.address} onChange={handleChange} />
              </div>
              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.label}>Ghi chú</label>
                <textarea className={styles.textarea} name="note" value={form.note} onChange={handleChange} />
              </div>
            </div>

            {/* Danh sách hợp đồng */}
            {contracts.length > 0 && (
              <>
                <p className={styles.sectionTitle}>Hợp đồng ({contracts.length})</p>
                <div className={styles.contractList}>
                  {contracts.map(c => (
                    <div key={c.id} className={styles.contractItem}>
                      <div>
                        <div className={styles.contractNum}>{c.contract_number}</div>
                        <div className={styles.contractPkg}>{c.package_name}</div>
                      </div>
                      <span className={styles.badge} style={contractBadgeStyle(c.status)}>
                        {STATUS_CONTRACT[c.status]?.label || c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Đóng</button>
            <button type="submit" disabled={loading} className={styles.confirmBtn}>
              {loading && <div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}} />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function contractBadgeStyle(s) {
  const map = {
    active:    { background: "rgba(34,197,94,0.1)",  color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" },
    pending:   { background: "rgba(234,179,8,0.1)",  color: "#facc15", border: "1px solid rgba(234,179,8,0.2)" },
    expired:   { background: "#334155", color: "#94a3b8", border: "1px solid #475569" },
    cancelled: { background: "#334155", color: "#94a3b8", border: "1px solid #475569" },
    rejected:  { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" },
  };
  return { fontSize: 11, padding: "3px 10px", borderRadius: 8, ...map[s] };
}

// ── Main page ─────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await api.get(`manage/customers/?${params}`);
      setCustomers(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    api.get("manage/customers/stats/").then(res => setStats(res.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchCustomers(); }, [search]);

  return (
    <AdminLayout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Quản lý Khách Hàng</h1>
            <p>Thông tin chi tiết và hợp đồng của khách hàng</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <p>Tổng khách hàng</p>
              <p className={`${styles.statValue} ${styles.statWhite}`}>{stats.total_customers}</p>
            </div>
            <div className={styles.statCard}>
              <p>Tổng hợp đồng</p>
              <p className={`${styles.statValue} ${styles.statBlue}`}>{stats.total_contracts}</p>
            </div>
            <div className={styles.statCard}>
              <p>Đang hiệu lực</p>
              <p className={`${styles.statValue} ${styles.statGreen}`}>{stats.active_contracts}</p>
            </div>
            <div className={styles.statCard}>
              <p>Chờ duyệt</p>
              <p className={`${styles.statValue} ${styles.statYellow}`}>{stats.pending_contracts}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input className={styles.searchInput} type="text" value={search}
              onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, email, CCCD..." />
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>CCCD/CMND</th>
                <th>Ngày sinh</th>
                <th>Thành phố</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className={styles.tableCenter}><div className={styles.spinner} /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className={styles.tableCenter}>Không có khách hàng nào</td></tr>
              ) : customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>{c.user_name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className={styles.userName}>{c.user_name}</div>
                        <div className={styles.userEmail}>{c.user_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.grayText}>{c.id_number || "—"}</td>
                  <td className={styles.grayText}>{c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className={styles.grayText}>{c.city || "—"}</td>
                  <td>
                    <span className={`${styles.badge} ${c.user_is_active ? styles.badgeActive : styles.badgeInactive}`}>
                      {c.user_is_active ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Xem chi tiết" onClick={() => setModal({ profile: c })}>
                        <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.tableFooter}>{customers.length} khách hàng</p>
      </div>

      {modal && <CustomerDetailModal profile={modal.profile} onClose={() => setModal(null)} onSaved={fetchCustomers} />}
    </AdminLayout>
  );
}