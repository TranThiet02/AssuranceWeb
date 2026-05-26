import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import styles from "../../css/Contractspage.module.css";

const STATUS_LIST = [
  { value: "",          label: "Tất cả" },
  { value: "pending",   label: "Chờ duyệt" },
  { value: "active",    label: "Hiệu lực" },
  { value: "expired",   label: "Hết hạn" },
  { value: "cancelled", label: "Đã huỷ" },
  { value: "rejected",  label: "Từ chối" },
];

function statusBadgeClass(s) {
  const map = { pending: styles.badgePending, active: styles.badgeActive, expired: styles.badgeExpired, cancelled: styles.badgeCancelled, rejected: styles.badgeRejected };
  return map[s] || "";
}
function statusLabel(s) {
  const map = { pending: "Chờ duyệt", active: "Hiệu lực", expired: "Hết hạn", cancelled: "Đã huỷ", rejected: "Từ chối" };
  return map[s] || s;
}
function formatMoney(n) { return Number(n).toLocaleString("vi-VN") + " đ"; }

// ── Create Contract Modal ────────────────────────────────────
function CreateContractModal({ onClose, onSaved }) {
  const [customers, setCustomers] = useState([]);
  const [packages,  setPackages]  = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({ customer: "", package: "", staff: "", start_date: "", end_date: "", premium_amount: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("manage/customers/").then(res => setCustomers(res.data.results ?? res.data));
    api.get("/assurance/packages/?status=active").then(res => setPackages(res.data.results ?? res.data));
    api.get("/users/?role=staff").then(res => setStaffList(res.data.results ?? res.data));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => {
      const next = { ...p, [name]: value };
      if (name === "package") {
        const pkg = packages.find(pk => pk.id === value);
        if (pkg) next.premium_amount = pkg.price;
      }
      return next;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      await api.post("/contracts/", form);
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
          <h3>Tạo hợp đồng mới</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.label}>Khách hàng *</label>
                <select className={styles.select} name="customer" value={form.customer} onChange={handleChange} required>
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => <option key={c.user} value={c.user}>{c.user_name} — {c.user_email}</option>)}
                </select>
              </div>
              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.label}>Gói bảo hiểm *</label>
                <select className={styles.select} name="package" value={form.package} onChange={handleChange} required>
                  <option value="">-- Chọn gói --</option>
                  {packages.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                </select>
              </div>
              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.label}>Nhân viên phụ trách</label>
                <select className={styles.select} name="staff" value={form.staff} onChange={handleChange}>
                  <option value="">-- Chọn nhân viên --</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Ngày bắt đầu</label>
                <input className={styles.input} type="date" name="start_date" value={form.start_date} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Ngày kết thúc</label>
                <input className={styles.input} type="date" name="end_date" value={form.end_date} onChange={handleChange} />
              </div>
              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.label}>Phí bảo hiểm (đ) *</label>
                <input className={styles.input} type="number" name="premium_amount" value={form.premium_amount} onChange={handleChange} required min={0} />
              </div>
              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.label}>Ghi chú</label>
                <textarea className={styles.textarea} name="note" value={form.note} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Huỷ</button>
            <button type="submit" disabled={loading} className={styles.confirmBtn}>
              {loading && <div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}} />}
              Tạo hợp đồng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Contract Detail Modal ─────────────────────────────────────
function ContractDetailModal({ contract, onClose, onSaved }) {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get(`manage/contracts/${contract.id}/`).then(res => setDetail(res.data)).catch((err) => console.log(err)).finally(() => setLoading(false));
  }, [contract.id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await api.post(`manage/contracts/${contract.id}/status/`, { status: newStatus });
      setDetail(res.data);
      onSaved();
    } catch { /* handled */ }
    finally { setUpdating(false); }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayBg} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{contract.contract_number}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          {loading ? (
            <div style={{textAlign:"center",padding:32}}><div className={styles.spinner} /></div>
          ) : (
            <>
              <p className={styles.sectionTitle}>Thông tin hợp đồng</p>
              <div className={styles.formGrid}>
                {[
                  ["Mã HĐ",      detail.contract_number],
                  ["Trạng thái", statusLabel(detail.status)],
                  ["Khách hàng", detail.customer_name],
                  ["Email KH",   detail.customer_email],
                  ["Gói BH",     `[${detail.package_code}] ${detail.package_name}`],
                  ["Phí BH",     formatMoney(detail.premium_amount)],
                  ["Từ ngày",    detail.start_date || "—"],
                  ["Đến ngày",   detail.end_date   || "—"],
                  ["NV phụ trách", detail.staff_name || "Chưa phân công"],
                  ["Ngày tạo",   new Date(detail.created_at).toLocaleDateString("vi-VN")],
                ].map(([k, v]) => (
                  <div key={k} className={styles.field}>
                    <label className={styles.label}>{k}</label>
                    <div style={{fontSize:13, color:"#fff"}}>{v}</div>
                  </div>
                ))}
                {detail.note && (
                  <div className={`${styles.field} ${styles.formGridFull}`}>
                    <label className={styles.label}>Ghi chú</label>
                    <div style={{fontSize:13, color:"#94a3b8"}}>{detail.note}</div>
                  </div>
                )}
              </div>

              {/* Cập nhật trạng thái */}
              <p className={styles.sectionTitle}>Cập nhật trạng thái</p>
              <div className={styles.statusBtns}>
                {["pending","active","expired","cancelled","rejected"].map(s => (
                  <button key={s} disabled={detail.status === s || updating}
                    onClick={() => handleStatusChange(s)}
                    style={{
                      padding: "8px 14px", borderRadius: 10, fontSize: 13, cursor: detail.status === s ? "default" : "pointer",
                      border: "1px solid", fontWeight: detail.status === s ? 600 : 400,
                      opacity: detail.status === s ? 1 : 0.7,
                      ...{
                        pending:   { background: "rgba(234,179,8,0.1)",  color: "#facc15", borderColor: "rgba(234,179,8,0.3)" },
                        active:    { background: "rgba(34,197,94,0.1)",  color: "#4ade80", borderColor: "rgba(34,197,94,0.3)" },
                        expired:   { background: "#334155", color: "#94a3b8", borderColor: "#475569" },
                        cancelled: { background: "#334155", color: "#94a3b8", borderColor: "#475569" },
                        rejected:  { background: "rgba(239,68,68,0.1)", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" },
                      }[s]
                    }}>
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} style={{flex:"none",width:"100%"}} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal]         = useState(null);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get(`manage/contracts/?${params}`);
      setContracts(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContracts(); }, [search, statusFilter]);

  return (
    <AdminLayout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Quản lý Hợp Đồng</h1>
            <p>Tạo và theo dõi trạng thái hợp đồng bảo hiểm</p>
          </div>
          <button className={styles.createBtn} onClick={() => setModal({ type: "create" })}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tạo hợp đồng
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input className={styles.searchInput} type="text" value={search}
              onChange={e => setSearch(e.target.value)} placeholder="Tìm mã HĐ, tên khách hàng..." />
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {STATUS_LIST.map(s => (
              <button key={s.value}
                className={`${styles.filterBtn} ${statusFilter === s.value ? styles.active : ""}`}
                onClick={() => setStatusFilter(s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Khách hàng</th>
                <th>Gói BH</th>
                <th>Phí BH</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className={styles.tableCenter}><div className={styles.spinner} /></td></tr>
              ) : contracts.length === 0 ? (
                <tr><td colSpan={7} className={styles.tableCenter}>Không có hợp đồng nào</td></tr>
              ) : contracts.map(c => (
                <tr key={c.id}>
                  <td><span className={styles.contractNum}>{c.contract_number}</span></td>
                  <td>
                    <div className={styles.customerName}>{c.customer_name}</div>
                    <div className={styles.customerEmail}>{c.customer_email}</div>
                  </td>
                  <td>
                    <div className={styles.pkgName}>{c.package_name}</div>
                    <div className={styles.pkgCode}>{c.package_code}</div>
                  </td>
                  <td className={styles.amount}>{formatMoney(c.premium_amount)}</td>
                  <td><span className={`${styles.badge} ${statusBadgeClass(c.status)}`}>{statusLabel(c.status)}</span></td>
                  <td className={styles.grayText}>{new Date(c.created_at).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Xem chi tiết" onClick={() => setModal({ type: "detail", contract: c })}>
                        <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.tableFooter}>{contracts.length} hợp đồng</p>
      </div>

      {modal?.type === "create" && <CreateContractModal onClose={() => setModal(null)} onSaved={fetchContracts} />}
      {modal?.type === "detail" && <ContractDetailModal contract={modal.contract} onClose={() => setModal(null)} onSaved={fetchContracts} />}
    </AdminLayout>
  );
}