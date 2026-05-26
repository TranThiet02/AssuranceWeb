import { useEffect, useState } from "react";
import StaffLayout from "../../components/StaffLayout";
import api from "../../services/api";

export default function MyCustomersPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(null);
  const [contracts, setContracts]     = useState([]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await api.get(`/staff/assignments/?${params}`);
      setAssignments(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAssignments(); }, [search]);

  const handleSelect = async (a) => {
    setSelected(a);
    const res = await api.get(`manage/contracts/?customer=${a.customer}`);
    console.log(res)
    setContracts(res.data.results ?? res.data);
  };

  const STATUS_STYLE = {
    active:    { background: "rgba(34,197,94,0.1)",  color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" },
    pending:   { background: "rgba(234,179,8,0.1)",  color: "#facc15", border: "1px solid rgba(234,179,8,0.2)" },
    expired:   { background: "#334155", color: "#94a3b8", border: "1px solid #475569" },
    cancelled: { background: "#334155", color: "#94a3b8", border: "1px solid #475569" },
    rejected:  { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" },
  };
  const STATUS_LABEL = { active:"Hiệu lực", pending:"Chờ duyệt", expired:"Hết hạn", cancelled:"Đã huỷ", rejected:"Từ chối" };

  return (
    <StaffLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Khách hàng của tôi</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Danh sách khách hàng được phân công chăm sóc</p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 320, marginBottom: 20 }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, stroke: "#64748b", fill: "none" }} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, email..."
            style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px 10px 38px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20 }}>
          {/* List */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  {["Khách hàng", "Số điện thoại", "Phân công lúc", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", padding: "14px 20px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ width: 24, height: 24, border: "2px solid #334155", borderTopColor: "#0d9488", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                  </td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: 48, color: "#475569", fontSize: 13 }}>Chưa có khách hàng nào được phân công</td></tr>
                ) : assignments.map(a => (
                  <tr key={a.id} onClick={() => handleSelect(a)}
                    style={{ borderBottom: "1px solid #263044", cursor: "pointer", backgroundColor: selected?.id === a.id ? "rgba(13,148,136,0.1)" : "transparent", transition: "background-color 0.15s" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                          {a.customer_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{a.customer_name}</p>
                          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{a.customer_email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748b" }}>{a.customer_phone || "—"}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748b" }}>{new Date(a.assigned_at).toLocaleDateString("vi-VN")}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <svg style={{ width: 16, height: 16, stroke: "#64748b", fill: "none" }} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 22, height: "fit-content" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Chi tiết</h3>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
                  <svg style={{ width: 18, height: 18, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
                  {selected.customer_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{selected.customer_name}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{selected.customer_email}</p>
                </div>
              </div>

              {[
                ["Số điện thoại", selected.customer_phone || "—"],
                ["Phân công lúc", new Date(selected.assigned_at).toLocaleDateString("vi-VN")],
                ["Ghi chú", selected.note || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 3px" }}>{k}</p>
                  <p style={{ fontSize: 13, color: "#fff", margin: 0 }}>{v}</p>
                </div>
              ))}

              {/* Contracts */}
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #334155" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Hợp đồng ({contracts.length})</p>
                {contracts.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#475569" }}>Chưa có hợp đồng</p>
                ) : contracts.map(c => (
                  <div key={c.id} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: "#fff", margin: 0 }}>{c.contract_number}</p>
                      <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{c.package_name}</p>
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 7, ...STATUS_STYLE[c.status] }}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
                <a href="/staff/schedules"
                  style={{ flex: 1, background: "#0d9488", color: "#fff", border: "none", padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 500, textAlign: "center", textDecoration: "none", display: "block" }}>
                  Đặt lịch hẹn
                </a>
              </div>
            </div>
          )}
        </div>
        <p style={{ fontSize: 12, color: "#475569", marginTop: 12 }}>{assignments.length} khách hàng</p>
      </div>
    </StaffLayout>
  );
}