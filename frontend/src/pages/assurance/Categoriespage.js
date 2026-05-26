import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

const s = {
  page: { padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "'Segoe UI', sans-serif", color: "#fff" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  h1: { fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 },
  sub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  createBtn: { display: "flex", alignItems: "center", gap: 8, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },
  card: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 20 },
  cardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cardName: { fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 4px" },
  cardDesc: { fontSize: 12, color: "#64748b", margin: 0 },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid #334155" },
  badgeActive: { fontSize: 11, padding: "3px 10px", borderRadius: 8, backgroundColor: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" },
  badgeInactive: { fontSize: 11, padding: "3px 10px", borderRadius: 8, backgroundColor: "#334155", color: "#94a3b8", border: "1px solid #475569" },
  actions: { display: "flex", gap: 4 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" },
  pkgCount: { fontSize: 12, color: "#64748b" },
  // overlay
  overlay: { position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  overlayBg: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" },
  modal: { position: "relative", backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #334155" },
  modalTitle: { fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" },
  modalBody: { padding: 24, display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, color: "#94a3b8" },
  input: { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, outline: "none", width: "100%" },
  textarea: { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, outline: "none", width: "100%", minHeight: 72, resize: "vertical", fontFamily: "inherit" },
  modalFooter: { display: "flex", gap: 12, padding: "0 24px 24px" },
  cancelBtn: { flex: 1, backgroundColor: "#334155", color: "#94a3b8", border: "none", padding: 10, borderRadius: 12, fontSize: 13, cursor: "pointer" },
  confirmBtn: { flex: 1, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: 10, borderRadius: 12, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  error: { backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, padding: "10px 14px", borderRadius: 10 },
  spinner: { width: 22, height: 22, border: "2px solid #334155", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "40px auto", display: "block" },
  empty: { textAlign: "center", padding: "60px 0", color: "#475569", fontSize: 13 },
};

function CategoryModal({ cat, onClose, onSaved }) {
  const isEdit = !!cat?.id;
  const [form, setForm] = useState({ name: cat?.name || "", description: cat?.description || "", is_active: cat?.is_active ?? true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = e => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [e.target.name]: val }));
  };

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      if (isEdit) await api.put(`/assurance/categories/${cat.id}/`, form);
      else        await api.post("/assurance/categories/", form);
      onSaved(); onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra.");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.overlay}>
      <div style={s.overlayBg} onClick={onClose} />
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>{isEdit ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}</h3>
          <button style={s.closeBtn} onClick={onClose}>
            <svg width={20} height={20} fill="none" stroke="#64748b" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={s.modalBody}>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.field}>
              <label style={s.label}>Tên danh mục *</label>
              <input style={s.input} name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Mô tả</label>
              <textarea style={s.textarea} name="description" value={form.description} onChange={handleChange} />
            </div>
            {isEdit && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#94a3b8", cursor: "pointer" }}>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} style={{ accentColor: "#2563eb" }} />
                Danh mục đang hoạt động
              </label>
            )}
          </div>
          <div style={s.modalFooter}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>Huỷ</button>
            <button type="submit" disabled={loading} style={s.confirmBtn}>
              {isEdit ? "Lưu thay đổi" : "Tạo danh mục"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/assurance/categories/");
      setCategories(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleDeactivate = async (cat) => {
    if (!window.confirm(`Vô hiệu hoá danh mục "${cat.name}"?`)) return;
    await api.delete(`/assurance/categories/${cat.id}/`);
    fetchCategories();
  };

  return (
    <AdminLayout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <h1 style={s.h1}>Danh Mục Bảo Hiểm</h1>
            <p style={s.sub}>Phân loại các gói bảo hiểm theo nhóm</p>
          </div>
          <button style={s.createBtn} onClick={() => setModal({ type: "create" })}>
            <svg width={16} height={16} fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tạo danh mục
          </button>
        </div>

        {loading ? (
          <div style={s.spinner} />
        ) : categories.length === 0 ? (
          <div style={s.empty}>Chưa có danh mục nào</div>
        ) : (
          <div style={s.grid}>
            {categories.map(cat => (
              <div key={cat.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.actions}>
                    <button style={s.actionBtn} title="Chỉnh sửa" onClick={() => setModal({ type: "edit", cat })}>
                      <svg width={15} height={15} fill="none" stroke="#94a3b8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                    </button>
                    {cat.is_active && (
                      <button style={s.actionBtn} title="Vô hiệu hoá" onClick={() => handleDeactivate(cat)}>
                        <svg width={15} height={15} fill="none" stroke="#f87171" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                    )}
                  </div>
                </div>
                <h3 style={s.cardName}>{cat.name}</h3>
                <p style={s.cardDesc}>{cat.description || "Chưa có mô tả"}</p>
                <div style={s.cardFooter}>
                  <span style={cat.is_active ? s.badgeActive : s.badgeInactive}>
                    {cat.is_active ? "Hoạt động" : "Vô hiệu"}
                  </span>
                  <span style={s.pkgCount}>{cat.package_count} gói đang bán</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal?.type === "create" && <CategoryModal onClose={() => setModal(null)} onSaved={fetchCategories} />}
      {modal?.type === "edit"   && <CategoryModal cat={modal.cat} onClose={() => setModal(null)} onSaved={fetchCategories} />}
    </AdminLayout>
  );
}