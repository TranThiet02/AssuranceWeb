import { useEffect, useState } from "react";
import CustomerLayout from "../../components/CustomerLayout";
import api from "../../services/api";

const formatMoney = n => Number(n).toLocaleString("vi-VN") + " đ";

const STATUS_MAP = {
  active:    { label: "Đang hiệu lực", bg: "rgba(34,197,94,0.1)",  color: "#4ade80", border: "rgba(34,197,94,0.2)" },
  pending:   { label: "Chờ duyệt",     bg: "rgba(234,179,8,0.1)",  color: "#facc15", border: "rgba(234,179,8,0.2)" },
  expired:   { label: "Hết hạn",       bg: "#334155",              color: "#94a3b8", border: "#475569" },
  cancelled: { label: "Đã huỷ",        bg: "#334155",              color: "#94a3b8", border: "#475569" },
  rejected:  { label: "Từ chối",       bg: "rgba(239,68,68,0.1)", color: "#f87171", border: "rgba(239,68,68,0.2)" },
};

function ContractDetailModal({ contract, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customer/contracts/${contract.id}/`).then(r => setDetail(r.data)).finally(() => setLoading(false));
  }, [contract.id]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#1e293b", border: "1px solid #334155", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #334155", position: "sticky", top: 0, background: "#1e293b", zIndex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>Chi tiết hợp đồng</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
            <svg style={{ width: 20, height: 20, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ width: 24, height: 24, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div style={{ background: STATUS_MAP[detail.status]?.bg, border: `1px solid ${STATUS_MAP[detail.status]?.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: STATUS_MAP[detail.status]?.color, margin: 0 }}>{STATUS_MAP[detail.status]?.label}</p>
                <p style={{ fontSize: 13, fontFamily: "monospace", color: STATUS_MAP[detail.status]?.color, margin: 0 }}>{detail.contract_number}</p>
              </div>

              {/* Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {[
                  ["Gói bảo hiểm", detail.package_name],
                  ["Mã gói",       detail.package_code],
                  ["Phí bảo hiểm", formatMoney(detail.premium_amount)],
                  ["NV phụ trách", detail.staff_name || "—"],
                  ["Ngày bắt đầu", detail.start_date ? new Date(detail.start_date).toLocaleDateString("vi-VN") : "—"],
                  ["Ngày kết thúc", detail.end_date   ? new Date(detail.end_date).toLocaleDateString("vi-VN")   : "—"],
                  ["Ngày tạo",     new Date(detail.created_at).toLocaleDateString("vi-VN")],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 3px" }}>{k}</p>
                    <p style={{ fontSize: 13, color: "#fff", margin: 0, fontWeight: 500 }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Note */}
              {detail.note && (
                <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>Ghi chú</p>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{detail.note}</p>
                </div>
              )}

              {/* Documents */}
              {detail.documents?.length > 0 && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Tài liệu đính kèm</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {detail.documents.map(doc => (
                      <a key={doc.id} href={doc.file} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 10, background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", textDecoration: "none" }}>
                        <svg style={{ width: 16, height: 16, stroke: "#a78bfa", fill: "none", flexShrink: 0 }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                        <p style={{ fontSize: 13, color: "#a78bfa", margin: 0 }}>{doc.name}</p>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerContractsPage() {
  const [contracts, setContracts]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected]         = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    api.get(`/customer/contracts/?${params}`)
      .then(r => setContracts(r.data.results ?? r.data))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const STATUS_FILTERS = [
    { value: "", label: "Tất cả" },
    { value: "active",    label: "Đang hiệu lực" },
    { value: "pending",   label: "Chờ duyệt" },
    { value: "expired",   label: "Hết hạn" },
    { value: "cancelled", label: "Đã huỷ" },
  ];

  return (
    <CustomerLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Hợp đồng của tôi</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Xem tất cả hợp đồng bảo hiểm của bạn</p>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              style={{ padding: "8px 14px", borderRadius: 12, fontSize: 13, border: "1px solid", cursor: "pointer",
                background: statusFilter === f.value ? "#7c3aed" : "#1e293b",
                borderColor: statusFilter === f.value ? "#7c3aed" : "#334155",
                color: statusFilter === f.value ? "#fff" : "#94a3b8" }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 28, height: 28, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : contracts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
            <p style={{ fontSize: 13, margin: "0 0 12px" }}>Bạn chưa có hợp đồng nào</p>
            <a href="/customer/packages" style={{ color: "#a78bfa", fontSize: 13 }}>Xem các gói bảo hiểm →</a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {contracts.map(c => {
              const s = STATUS_MAP[c.status];
              return (
                <div key={c.id} onClick={() => setSelected(c)}
                  style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 20, cursor: "pointer", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#7c3aed"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#334155"}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace", color: "#fff", margin: "0 0 2px" }}>{c.contract_number}</p>
                      <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{c.package_name}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 8, background: s?.bg, color: s?.color, border: `1px solid ${s?.border}`, flexShrink: 0 }}>
                      {s?.label}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, paddingTop: 12, borderTop: "1px solid #334155" }}>
                    {[
                      ["Phí BH", formatMoney(c.premium_amount)],
                      ["NV phụ trách", c.staff_name || "—"],
                      ["Ngày tạo", new Date(c.created_at).toLocaleDateString("vi-VN")],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 2px" }}>{k}</p>
                        <p style={{ fontSize: 13, color: "#fff", margin: 0 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p style={{ fontSize: 12, color: "#475569", marginTop: 14 }}>{contracts.length} hợp đồng</p>
      </div>

      {selected && <ContractDetailModal contract={selected} onClose={() => setSelected(null)} />}
    </CustomerLayout>
  );
}