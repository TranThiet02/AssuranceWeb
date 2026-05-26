import { useEffect, useState } from "react";
import StaffLayout from "../../components/StaffLayout";
import api from "../../services/api";

const STATUS_STYLE = {
  pending:   { background: "rgba(234,179,8,0.1)",  color: "#facc15", border: "1px solid rgba(234,179,8,0.2)" },
  active:    { background: "rgba(34,197,94,0.1)",  color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" },
  expired:   { background: "#334155", color: "#94a3b8", border: "1px solid #475569" },
  cancelled: { background: "#334155", color: "#94a3b8", border: "1px solid #475569" },
  rejected:  { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" },
};
const STATUS_LABEL = { pending:"Chờ duyệt", active:"Hiệu lực", expired:"Hết hạn", cancelled:"Đã huỷ", rejected:"Từ chối" };
const formatMoney = n => Number(n).toLocaleString("vi-VN") + " đ";

export default function StaffContractsPage() {
  const [contracts, setContracts]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch]         = useState("");

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (search)       params.append("search", search);
      const res = await api.get(`manage/contracts/?${params}`);
      setContracts(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContracts(); }, [statusFilter, search]);

  const STATUS_FILTERS = [
    { value: "", label: "Tất cả" },
    { value: "pending", label: "Chờ duyệt" },
    { value: "active",  label: "Hiệu lực" },
    { value: "expired", label: "Hết hạn" },
  ];

  return (
    <StaffLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Hợp đồng</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Danh sách hợp đồng bạn đang phụ trách</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", maxWidth: 280 }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, stroke: "#64748b", fill: "none" }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã HĐ, tên khách hàng..."
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px 10px 38px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                style={{ padding: "9px 14px", borderRadius: 12, fontSize: 13, border: "1px solid", cursor: "pointer",
                  background: statusFilter === f.value ? "#0d9488" : "#1e293b",
                  borderColor: statusFilter === f.value ? "#0d9488" : "#334155",
                  color: statusFilter === f.value ? "#fff" : "#94a3b8" }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155" }}>
                {["Mã HĐ", "Khách hàng", "Gói BH", "Phí BH", "Trạng thái", "Ngày tạo"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", padding: "14px 20px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 48 }}>
                  <div style={{ width: 24, height: 24, border: "2px solid #334155", borderTopColor: "#0d9488", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                </td></tr>
              ) : contracts.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 48, color: "#475569", fontSize: 13 }}>Không có hợp đồng nào</td></tr>
              ) : contracts.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid #263044" }}>
                  <td style={{ padding: "14px 20px", fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: "#fff" }}>{c.contract_number}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{c.customer_name}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{c.customer_email}</p>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <p style={{ fontSize: 13, margin: 0 }}>{c.package_name}</p>
                    <p style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", margin: 0 }}>{c.package_code}</p>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 500, color: "#fff" }}>{formatMoney(c.premium_amount)}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 8, ...STATUS_STYLE[c.status] }}>{STATUS_LABEL[c.status]}</span>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748b" }}>{new Date(c.created_at).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: "#475569", marginTop: 12 }}>{contracts.length} hợp đồng</p>
      </div>
    </StaffLayout>
  );
}