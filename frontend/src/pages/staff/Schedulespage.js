import { useEffect, useState } from "react";
import StaffLayout from "../../components/StaffLayout";
import api from "../../services/api";

const STATUS_STYLE = {
  pending:   { background: "rgba(234,179,8,0.1)",  color: "#facc15", border: "1px solid rgba(234,179,8,0.2)" },
  confirmed: { background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" },
  done:      { background: "rgba(34,197,94,0.1)",  color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" },
  cancelled: { background: "#334155", color: "#94a3b8", border: "1px solid #475569" },
};
const STATUS_LABEL = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", done: "Hoàn thành", cancelled: "Đã huỷ" };

function ScheduleModal({ schedule, customers, onClose, onSaved }) {
  const isEdit = !!schedule?.id;
  const [form, setForm] = useState({
    customer:     schedule?.customer     || "",
    title:        schedule?.title        || "",
    description:  schedule?.description  || "",
    scheduled_at: schedule?.scheduled_at ? schedule.scheduled_at.slice(0, 16) : "",
    status:       schedule?.status       || "pending",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      if (isEdit) await api.put(`/staff/schedules/${schedule.id}/`, form);
      else        await api.post("/staff/schedules/", form);
      onSaved(); onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra.");
    } finally { setLoading(false); }
  };

  const inputStyle = { width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#1e293b", border: "1px solid #334155", borderRadius: 20, width: "100%", maxWidth: 460, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #334155" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>{isEdit ? "Sửa lịch hẹn" : "Tạo lịch hẹn mới"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
            <svg style={{ width: 20, height: 20, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, padding: "10px 14px", borderRadius: 10 }}>{error}</div>}
            <div>
              <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Khách hàng *</label>
              <select name="customer" value={form.customer} onChange={handleChange} required style={inputStyle}>
                <option value="">-- Chọn khách hàng --</option>
                {customers.map(c => <option key={c.customer} value={c.customer}>{c.customer_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Tiêu đề *</label>
              <input name="title" value={form.title} onChange={handleChange} required style={inputStyle} placeholder="VD: Tư vấn gói bảo hiểm..." />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Thời gian *</label>
              <input type="datetime-local" name="scheduled_at" value={form.scheduled_at} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Mô tả</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", minHeight: 72 }} />
            </div>
            {isEdit && (
              <div>
                <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Trạng thái</label>
                <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="done">Hoàn thành</option>
                  <option value="cancelled">Đã huỷ</option>
                </select>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, padding: "0 24px 24px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: "#334155", color: "#94a3b8", border: "none", padding: 10, borderRadius: 12, fontSize: 13, cursor: "pointer" }}>Huỷ</button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, background: "#0d9488", color: "#fff", border: "none", padding: 10, borderRadius: 12, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
              {isEdit ? "Lưu" : "Tạo lịch hẹn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SchedulesPage() {
  const [schedules, setSchedules]   = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal]           = useState(null);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get(`/staff/schedules/?${params}`);
      setSchedules(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    api.get("/staff/assignments/").then(res => setCustomers(res.data.results ?? res.data));
  }, []);

  useEffect(() => { fetchSchedules(); }, [statusFilter]);

  const STATUS_FILTERS = [
    { value: "", label: "Tất cả" },
    { value: "pending",   label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "done",      label: "Hoàn thành" },
    { value: "cancelled", label: "Đã huỷ" },
  ];

  return (
    <StaffLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Lịch hẹn</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Quản lý lịch tư vấn và gặp mặt khách hàng</p>
          </div>
          <button onClick={() => setModal({ type: "create" })}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d9488", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            <svg style={{ width: 16, height: 16, stroke: "#fff", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tạo lịch hẹn
          </button>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              style={{ padding: "8px 14px", borderRadius: 12, fontSize: 13, border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                background: statusFilter === f.value ? "#0d9488" : "#1e293b",
                borderColor: statusFilter === f.value ? "#0d9488" : "#334155",
                color: statusFilter === f.value ? "#fff" : "#94a3b8" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155" }}>
                {["Tiêu đề", "Khách hàng", "Thời gian", "Trạng thái", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", padding: "14px 20px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 48 }}>
                  <div style={{ width: 24, height: 24, border: "2px solid #334155", borderTopColor: "#0d9488", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                </td></tr>
              ) : schedules.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: "#475569", fontSize: 13 }}>Không có lịch hẹn nào</td></tr>
              ) : schedules.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #263044" }}>
                  <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 500 }}>{s.title}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <p style={{ fontSize: 13, margin: 0 }}>{s.customer_name}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{s.customer_email}</p>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#94a3b8" }}>{new Date(s.scheduled_at).toLocaleString("vi-VN")}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 8, ...STATUS_STYLE[s.status] }}>{STATUS_LABEL[s.status]}</span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <button onClick={() => setModal({ type: "edit", schedule: s })}
                      style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                      <svg style={{ width: 15, height: 15, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: "#475569", marginTop: 12 }}>{schedules.length} lịch hẹn</p>
      </div>

      {modal?.type === "create" && <ScheduleModal customers={customers} onClose={() => setModal(null)} onSaved={fetchSchedules} />}
      {modal?.type === "edit"   && <ScheduleModal schedule={modal.schedule} customers={customers} onClose={() => setModal(null)} onSaved={fetchSchedules} />}
    </StaffLayout>
  );
}