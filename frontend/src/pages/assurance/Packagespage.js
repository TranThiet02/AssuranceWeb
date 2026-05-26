import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import styles from "../../css/Packagespage.module.css";

const STATUS_LIST = [
  { value: "", label: "Tất cả" },
  { value: "active",   label: "Đang bán" },
  { value: "inactive", label: "Ngừng bán" },
  { value: "draft",    label: "Nháp" },
];
const PAYMENT_CYCLE_LABEL = {
  monthly: "Hàng tháng", quarterly: "Hàng quý",
  yearly: "Hàng năm", one_time: "Một lần",
};

function statusBadgeClass(s) {
  if (s === "active")   return styles.badgeActive;
  if (s === "inactive") return styles.badgeInactive;
  if (s === "draft")    return styles.badgeDraft;
  return "";
}
function statusLabel(s) {
  if (s === "active")   return "Đang bán";
  if (s === "inactive") return "Ngừng bán";
  if (s === "draft")    return "Nháp";
  return s;
}
function formatMoney(n) {
  return Number(n).toLocaleString("vi-VN") + " đ";
}

function PackageModal({ pkg, categories, onClose, onSaved }) {
  const isEdit = !!pkg?.id;
  const [form, setForm] = useState({
    category:        pkg?.category    || "",
    name:            pkg?.name        || "",
    code:            pkg?.code        || "",
    description:     pkg?.description || "",
    coverage_detail: pkg?.coverage_detail || "",
    price:           pkg?.price       || "",
    payment_cycle:   pkg?.payment_cycle || "yearly",
    coverage_amount: pkg?.coverage_amount || "",
    duration_months: pkg?.duration_months || 12,
    min_age:         pkg?.min_age     || 18,
    max_age:         pkg?.max_age     || 65,
    status:          pkg?.status      || "draft",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (isEdit) await api.put(`/assurance/packages/${pkg.id}/`, form);
      else        await api.post("/assurance/packages/", form);
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
          <h3>{isEdit ? "Chỉnh sửa gói bảo hiểm" : "Tạo gói bảo hiểm mới"}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Danh mục *</label>
                <select className={styles.select} name="category" value={form.category} onChange={handleChange} required>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Mã gói *</label>
                <input className={styles.input} name="code" value={form.code} onChange={handleChange} required placeholder="VD: BH-SK-001" />
              </div>
              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.label}>Tên gói *</label>
                <input className={styles.input} name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.label}>Mô tả</label>
                <textarea className={styles.textarea} name="description" value={form.description} onChange={handleChange} rows={3} />
              </div>
              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.label}>Chi tiết quyền lợi</label>
                <textarea className={styles.textarea} name="coverage_detail" value={form.coverage_detail} onChange={handleChange} rows={3} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phí bảo hiểm (đ) *</label>
                <input className={styles.input} type="number" name="price" value={form.price} onChange={handleChange} required min={0} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Chu kỳ thanh toán</label>
                <select className={styles.select} name="payment_cycle" value={form.payment_cycle} onChange={handleChange}>
                  <option value="monthly">Hàng tháng</option>
                  <option value="quarterly">Hàng quý</option>
                  <option value="yearly">Hàng năm</option>
                  <option value="one_time">Một lần</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Số tiền BH tối đa (đ) *</label>
                <input className={styles.input} type="number" name="coverage_amount" value={form.coverage_amount} onChange={handleChange} required min={0} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Thời hạn (tháng)</label>
                <input className={styles.input} type="number" name="duration_months" value={form.duration_months} onChange={handleChange} min={1} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tuổi tối thiểu</label>
                <input className={styles.input} type="number" name="min_age" value={form.min_age} onChange={handleChange} min={0} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tuổi tối đa</label>
                <input className={styles.input} type="number" name="max_age" value={form.max_age} onChange={handleChange} min={0} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Trạng thái</label>
                <select className={styles.select} name="status" value={form.status} onChange={handleChange}>
                  <option value="draft">Nháp</option>
                  <option value="active">Đang bán</option>
                  <option value="inactive">Ngừng bán</option>
                </select>
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Huỷ</button>
            <button type="submit" disabled={loading} className={styles.confirmBtn}>
              {loading && <div className={styles.spinner} style={{width:14,height:14,borderWidth:2}} />}
              {isEdit ? "Lưu thay đổi" : "Tạo gói"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detail Modal (xem chi tiết + quy trình) ───────────────────
function DetailModal({ pkg, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/insurance/packages/${pkg.id}/`).then(res => setDetail(res.data)).finally(() => setLoading(false));
  }, [pkg.id]);

  const registrationSteps = detail?.processes?.filter(p => p.process_type === "registration") || [];
  const claimSteps        = detail?.processes?.filter(p => p.process_type === "claim") || [];

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayBg} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{pkg.name}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          {loading ? (
            <div style={{textAlign:"center",padding:32}}><div className={styles.spinner} /></div>
          ) : (
            <>
              <div className={styles.formGrid}>
                {[
                  ["Mã gói", detail.code],
                  ["Danh mục", detail.category_name],
                  ["Phí BH", formatMoney(detail.price)],
                  ["Chu kỳ", PAYMENT_CYCLE_LABEL[detail.payment_cycle]],
                  ["BH tối đa", formatMoney(detail.coverage_amount)],
                  ["Thời hạn", `${detail.duration_months} tháng`],
                  ["Độ tuổi", `${detail.min_age} – ${detail.max_age}`],
                  ["Trạng thái", statusLabel(detail.status)],
                ].map(([k, v]) => (
                  <div key={k} className={styles.field}>
                    <label className={styles.label}>{k}</label>
                    <div style={{fontSize:13, color:"#fff"}}>{v}</div>
                  </div>
                ))}
                {detail.description && (
                  <div className={`${styles.field} ${styles.formGridFull}`}>
                    <label className={styles.label}>Mô tả</label>
                    <div style={{fontSize:13, color:"#94a3b8"}}>{detail.description}</div>
                  </div>
                )}
              </div>

              {registrationSteps.length > 0 && (
                <div className={styles.detailSection}>
                  <div className={styles.detailTitle}>Quy trình đăng ký</div>
                  <div className={styles.processList}>
                    {registrationSteps.map(s => (
                      <div key={s.id} className={styles.processItem}>
                        <div className={styles.processStep}>{s.step_order}</div>
                        <div>
                          <div className={styles.processTitle}>{s.title}</div>
                          {s.description && <div className={styles.processDesc}>{s.description}</div>}
                          <div className={styles.processDesc}>⏱ {s.duration_days} ngày</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {claimSteps.length > 0 && (
                <div className={styles.detailSection}>
                  <div className={styles.detailTitle}>Quy trình bồi thường</div>
                  <div className={styles.processList}>
                    {claimSteps.map(s => (
                      <div key={s.id} className={styles.processItem}>
                        <div className={styles.processStep}>{s.step_order}</div>
                        <div>
                          <div className={styles.processTitle}>{s.title}</div>
                          {s.description && <div className={styles.processDesc}>{s.description}</div>}
                          <div className={styles.processDesc}>⏱ {s.duration_days} ngày</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
export default function PackagesPage() {
  const [packages, setPackages]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal]           = useState(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get(`/assurance/packages/?${params}`);
      setPackages(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    api.get("/assurance/categories/").then(res => setCategories(res.data.results ?? res.data));
  }, []);

  useEffect(() => { fetchPackages(); }, [search, statusFilter]);

  const handleDeactivate = async (pkg) => {
    if (!window.confirm(`Ngừng bán gói "${pkg.name}"?`)) return;
    await api.delete(`/insurance/packages/${pkg.id}/`);
    fetchPackages();
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Quản lý Gói Bảo Hiểm</h1>
            <p>Tạo và quản lý các gói, quy trình bảo hiểm</p>
          </div>
          <button className={styles.createBtn} onClick={() => setModal({ type: "create" })}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tạo gói mới
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input className={styles.searchInput} type="text" value={search}
              onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, mã gói..." />
          </div>
          <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className={styles.filterSelect} onChange={e => {
            const params = new URLSearchParams();
            if (e.target.value) params.append("category", e.target.value);
            if (search) params.append("search", search);
            if (statusFilter) params.append("status", statusFilter);
            api.get(`/assurance/packages/?${params}`).then(res => setPackages(res.data.results ?? res.data));
          }}>
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Gói bảo hiểm</th>
                <th>Danh mục</th>
                <th>Phí / Chu kỳ</th>
                <th>BH tối đa</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className={styles.tableCenter}><div className={styles.spinner} /></td></tr>
              ) : packages.length === 0 ? (
                <tr><td colSpan={6} className={styles.tableCenter}>Không có gói bảo hiểm nào</td></tr>
              ) : packages.map(pkg => (
                <tr key={pkg.id}>
                  <td>
                    <div className={styles.packageName}>{pkg.name}</div>
                    <div className={styles.packageCode}>{pkg.code}</div>
                  </td>
                  <td><span className={styles.categoryBadge}>{pkg.category_name}</span></td>
                  <td>
                    <div className={styles.priceText}>{formatMoney(pkg.price)}</div>
                    <span className={styles.cycleBadge}>{PAYMENT_CYCLE_LABEL[pkg.payment_cycle]}</span>
                  </td>
                  <td className={styles.coverageText}>{formatMoney(pkg.coverage_amount)}</td>
                  <td><span className={`${styles.badge} ${statusBadgeClass(pkg.status)}`}>{statusLabel(pkg.status)}</span></td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Xem chi tiết" onClick={() => setModal({ type: "detail", pkg })}>
                        <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                      <button className={styles.actionBtn} title="Chỉnh sửa" onClick={() => setModal({ type: "edit", pkg })}>
                        <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                      </button>
                      {pkg.status !== "inactive" && (
                        <button className={`${styles.actionBtn} ${styles.danger}`} title="Ngừng bán" onClick={() => handleDeactivate(pkg)}>
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
        <p className={styles.tableFooter}>{packages.length} gói bảo hiểm</p>
      </div>

      {modal?.type === "create" && <PackageModal categories={categories} onClose={() => setModal(null)} onSaved={fetchPackages} />}
      {modal?.type === "edit"   && <PackageModal pkg={modal.pkg} categories={categories} onClose={() => setModal(null)} onSaved={fetchPackages} />}
      {modal?.type === "detail" && <DetailModal pkg={modal.pkg} onClose={() => setModal(null)} />}
    </AdminLayout>
  );
}