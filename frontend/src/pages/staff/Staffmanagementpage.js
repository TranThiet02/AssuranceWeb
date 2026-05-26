import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

const inputStyle = { width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, outline: "none", boxSizing: "border-box" };
const labelStyle = { fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 };

// ── Assign Modal ──────────────────────────────────────────────
function AssignModal({ onClose, onSaved }) {
  const [staffList, setStaffList]     = useState([]);
  const [customers, setCustomers]     = useState([]);
  const [form, setForm]               = useState({ staff: "", customer: "", note: "" });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    api.get("/users/?role=staff").then(res => setStaffList(res.data.results ?? res.data));
    api.get("manage/customers/").then(res => setCustomers(res.data.results ?? res.data)).catch((err) => console.log(err));
  }, []);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      await api.post("/staff/assignments/", form);
      onSaved(); onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#1e293b", border: "1px solid #334155", borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #334155" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>Phân công nhân viên</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
            <svg style={{ width: 20, height: 20, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, padding: "10px 14px", borderRadius: 10 }}>{error}</div>}
            <div>
              <label style={labelStyle}>Nhân viên *</label>
              <select name="staff" value={form.staff} onChange={handleChange} required style={inputStyle}>
                <option value="">-- Chọn nhân viên --</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.email}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Khách hàng *</label>
              <select name="customer" value={form.customer} onChange={handleChange} required style={inputStyle}>
                <option value="">-- Chọn khách hàng --</option>
                {customers.map(c => <option key={c.user} value={c.user}>{c.user_name} — {c.user_email}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ghi chú</label>
              <textarea name="note" value={form.note} onChange={handleChange} rows={3}
                style={{ ...inputStyle, resize: "vertical", minHeight: 72, fontFamily: "inherit" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, padding: "0 24px 24px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: "#334155", color: "#94a3b8", border: "none", padding: 10, borderRadius: 12, fontSize: 13, cursor: "pointer" }}>Huỷ</button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, background: "#2563eb", color: "#fff", border: "none", padding: 10, borderRadius: 12, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
              Phân công
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function StaffManagementPage() {
  const [staffList, setStaffList]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [search, setSearch]           = useState("");

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get("/staff/list/");
      setStaffList(res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  const fetchAssignments = async (staffId) => {
    setAssignLoading(true);
    try {
      const res = await api.get(`/staff/assignments/?staff=${staffId}`);
      setAssignments(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setAssignLoading(false); }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSelectStaff = (staff) => {
    setSelectedStaff(staff);
    fetchAssignments(staff.id);
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm("Huỷ phân công này?")) return;
    await api.delete(`/staff/assignments/${assignmentId}/`);
    fetchAssignments(selectedStaff.id);
    fetchStaff();
  };

  const filteredStaff = staffList.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Quản lý Nhân Viên</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Phân công nhân viên chăm sóc khách hàng</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            <svg style={{ width: 16, height: 16, stroke: "#fff", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Phân công mới
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
          {/* Staff list */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, overflow: "hidden", height: "fit-content" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #334155" }}>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, stroke: "#64748b", fill: "none" }} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhân viên..."
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#fff", borderRadius: 10, padding: "8px 12px 8px 32px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ width: 24, height: 24, border: "2px solid #334155", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>Không có nhân viên</div>
            ) : filteredStaff.map(s => (
              <div key={s.id} onClick={() => handleSelectStaff(s)}
                style={{ padding: "14px 16px", borderBottom: "1px solid #263044", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: selectedStaff?.id === s.id ? "rgba(37,99,235,0.1)" : "transparent",
                  borderLeft: selectedStaff?.id === s.id ? "3px solid #2563eb" : "3px solid transparent",
                  transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                    {s.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{s.full_name}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{s.email}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa", margin: 0 }}>{s.customer_count}</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>KH</p>
                </div>
              </div>
            ))}
          </div>

          {/* Assignment list */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, overflow: "hidden", height: "fit-content" }}>
            {!selectedStaff ? (
              <div style={{ padding: 60, textAlign: "center", color: "#475569" }}>
                <svg style={{ width: 40, height: 40, stroke: "#334155", fill: "none", margin: "0 auto 12px", display: "block" }} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <p style={{ fontSize: 13, margin: 0 }}>Chọn nhân viên để xem danh sách khách hàng phụ trách</p>
              </div>
            ) : (
              <>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Khách hàng của {selectedStaff.full_name}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{assignments.length} khách hàng được phân công</p>
                  </div>
                </div>

                {assignLoading ? (
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <div style={{ width: 24, height: 24, border: "2px solid #334155", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                  </div>
                ) : assignments.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: "#475569", fontSize: 13 }}>Chưa có khách hàng nào được phân công</div>
                ) : assignments.map(a => (
                  <div key={a.id} style={{ padding: "14px 20px", borderBottom: "1px solid #263044", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>
                        {a.customer_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{a.customer_name}</p>
                        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{a.customer_email}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{new Date(a.assigned_at).toLocaleDateString("vi-VN")}</p>
                      <button onClick={() => handleRemoveAssignment(a.id)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                        title="Huỷ phân công">
                        <svg style={{ width: 15, height: 15, stroke: "#f87171", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && <AssignModal onClose={() => setShowModal(false)} onSaved={() => { fetchStaff(); if (selectedStaff) fetchAssignments(selectedStaff.id); }} />}
    </AdminLayout>
  );
}