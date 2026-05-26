import { useEffect, useState } from "react";
import CustomerLayout from "../../components/CustomerLayout";
import api from "../../services/api";

const formatMoney = n => Number(n).toLocaleString("vi-VN") + " đ";
const CYCLE_LABEL = { monthly: "Tháng", quarterly: "Quý", yearly: "Năm", one_time: "Một lần" };

// ── Modal đăng ký gói ─────────────────────────────────────────
function RegisterModal({ pkg, onClose, onSuccess }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm]       = useState({ start_date: today, note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Tính ngày kết thúc dự kiến
  const calcEndDate = () => {
    if (!form.start_date) return "";
    const d = new Date(form.start_date);
    d.setMonth(d.getMonth() + pkg.duration_months);
    return d.toLocaleDateString("vi-VN");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post("/customer/register-package/", {
        package_id: pkg.id,
        start_date: form.start_date,
        note:       form.note,
      });
      onSuccess(res.data);
      onClose();
    } catch (err) {
      console.log(err)
      const data = err.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra.");
    } finally { setLoading(false); }
  };

  const inputStyle = { width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#1e293b", border: "1px solid #334155", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #334155" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>Đăng ký gói bảo hiểm</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
            <svg style={{ width: 20, height: 20, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Package summary */}
        <div style={{ margin: "20px 24px 0", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 14, padding: "16px" }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 10px" }}>{pkg.name}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              ["Phí BH", formatMoney(pkg.price)],
              ["Chu kỳ", CYCLE_LABEL[pkg.payment_cycle]],
              ["Thời hạn", `${pkg.duration_months} tháng`],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 2px" }}>{k}</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#a78bfa", margin: 0 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, padding: "10px 14px", borderRadius: 10 }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Ngày bắt đầu *</label>
              <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                min={today} required style={inputStyle} />
              {form.start_date && (
                <p style={{ fontSize: 12, color: "#64748b", margin: "5px 0 0" }}>
                  Ngày kết thúc dự kiến: <span style={{ color: "#a78bfa" }}>{calcEndDate()}</span>
                </p>
              )}
            </div>

            <div>
              <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Ghi chú (tuỳ chọn)</label>
              <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                rows={3} placeholder="Thông tin thêm bạn muốn gửi cho nhân viên..."
                style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} />
            </div>

            {/* Info box */}
            <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: "12px 16px" }}>
              <p style={{ fontSize: 12, color: "#60a5fa", margin: 0, lineHeight: 1.6 }}>
                ℹ️ Sau khi gửi, yêu cầu sẽ ở trạng thái <strong>Chờ duyệt</strong>. Nhân viên phụ trách sẽ liên hệ để xác nhận và hoàn tất hợp đồng.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, padding: "0 24px 24px" }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, background: "#334155", color: "#94a3b8", border: "none", padding: 10, borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              Huỷ
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, background: "#7c3aed", color: "#fff", border: "none", padding: 10, borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
              {loading ? "Đang gửi..." : "Gửi yêu cầu đăng ký"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal thành công ──────────────────────────────────────────
function SuccessModal({ data, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#1e293b", border: "1px solid #334155", borderRadius: 20, width: "100%", maxWidth: 400, padding: 32, textAlign: "center", boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
          ✅
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>Đăng ký thành công!</h3>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>
          Yêu cầu của bạn đã được gửi. Nhân viên phụ trách sẽ liên hệ để xác nhận.
        </p>
        <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 3px" }}>Mã hợp đồng</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#a78bfa", fontFamily: "monospace", margin: 0 }}>
            {data?.contract?.contract_number}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "#334155", color: "#94a3b8", border: "none", padding: 10, borderRadius: 12, fontSize: 13, cursor: "pointer" }}>
            Đóng
          </button>
          <a href="/customer/contracts"
            style={{ flex: 1, background: "#7c3aed", color: "#fff", border: "none", padding: 10, borderRadius: 12, fontSize: 13, fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Xem hợp đồng →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Package Detail Modal ──────────────────────────────────────
function PackageDetailModal({ pkg, onClose, onRegister }) {
  const [detail, setDetail]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [regStatus, setRegStatus]   = useState(null); // null | { registered, status, contract_number }

  useEffect(() => {
    Promise.all([
      api.get(`/customer/packages/${pkg.id}/`),
      api.get(`/customer/packages/${pkg.id}/check-registration/`),
    ]).then(([d, r]) => {
      setDetail(d.data);
      setRegStatus(r.data);
    }).finally(() => setLoading(false));
  }, [pkg.id]);

  const regSteps   = detail?.processes?.filter(p => p.process_type === "registration") || [];
  const claimSteps = detail?.processes?.filter(p => p.process_type === "claim") || [];

  const RegisterBtn = () => {
    if (!regStatus) return null;
    if (regStatus.registered) {
      const statusColor = regStatus.status === "active" ? "#4ade80" : "#facc15";
      return (
        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: statusColor, margin: "0 0 2px", fontWeight: 600 }}>
            ✓ Đã đăng ký — {regStatus.status === "active" ? "Đang hiệu lực" : "Chờ duyệt"}
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Mã HĐ: {regStatus.contract_number}</p>
        </div>
      );
    }
    return (
      <button onClick={() => { onClose(); onRegister(pkg); }}
        style={{ width: "100%", background: "#7c3aed", color: "#fff", border: "none", padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        Đăng ký gói này →
      </button>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#1e293b", border: "1px solid #334155", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #334155", position: "sticky", top: 0, background: "#1e293b", zIndex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>{pkg.name}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
            <svg style={{ width: 20, height: 20, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ width: 24, height: 24, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
            </div>
          ) : (
            <>
              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {[
                  ["Mã gói",    detail.code],
                  ["Danh mục",  detail.category_name],
                  ["Phí BH",    formatMoney(detail.price)],
                  ["Chu kỳ",    CYCLE_LABEL[detail.payment_cycle]],
                  ["BH tối đa", formatMoney(detail.coverage_amount)],
                  ["Thời hạn",  `${detail.duration_months} tháng`],
                  ["Độ tuổi",   `${detail.min_age} – ${detail.max_age} tuổi`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 3px" }}>{k}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {detail.description && (
                <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px" }}>Mô tả</p>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{detail.description}</p>
                </div>
              )}

              {/* Coverage detail */}
              {detail.coverage_detail && (
                <div style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "#a78bfa", margin: "0 0 6px", fontWeight: 600 }}>Quyền lợi bảo hiểm</p>
                  <p style={{ fontSize: 13, color: "#c4b5fd", margin: 0, lineHeight: 1.7, whiteSpace: "pre-line" }}>{detail.coverage_detail}</p>
                </div>
              )}

              {/* Quy trình đăng ký */}
              {regSteps.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Quy trình đăng ký</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {regSteps.map(s => (
                      <div key={s.id} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{s.step_order}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: "0 0 2px" }}>{s.title}</p>
                          {s.description && <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{s.description}</p>}
                          <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>⏱ {s.duration_days} ngày</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quy trình bồi thường */}
              {claimSteps.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Quy trình bồi thường</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {claimSteps.map(s => (
                      <div key={s.id} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{s.step_order}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: "0 0 2px" }}>{s.title}</p>
                          {s.description && <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{s.description}</p>}
                          <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>⏱ {s.duration_days} ngày</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Register button */}
              <RegisterBtn />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function CustomerPackagesPage() {
  const [packages, setPackages]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("");
  const [detailPkg, setDetailPkg]   = useState(null);   // modal chi tiết
  const [registerPkg, setRegisterPkg] = useState(null); // modal đăng ký
  const [successData, setSuccessData] = useState(null); // modal thành công

  useEffect(() => {
    api.get("/assurance/categories/").then(r => setCategories(r.data.results ?? r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)    params.append("search", search);
    if (catFilter) params.append("category", catFilter);
    api.get(`/customer/packages/?${params}`)
      .then(r => setPackages(r.data.results ?? r.data))
      .finally(() => setLoading(false));
  }, [search, catFilter]);

  return (
    <CustomerLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Gói Bảo Hiểm</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Khám phá và đăng ký gói bảo hiểm phù hợp với bạn</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, stroke: "#64748b", fill: "none" }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm gói bảo hiểm..."
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px 10px 38px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setCatFilter("")}
              style={{ padding: "9px 14px", borderRadius: 12, fontSize: 13, border: "1px solid", cursor: "pointer", background: catFilter === "" ? "#7c3aed" : "#1e293b", borderColor: catFilter === "" ? "#7c3aed" : "#334155", color: catFilter === "" ? "#fff" : "#94a3b8" }}>
              Tất cả
            </button>
            {categories.filter(c => c.is_active).map(c => (
              <button key={c.id} onClick={() => setCatFilter(c.id)}
                style={{ padding: "9px 14px", borderRadius: 12, fontSize: 13, border: "1px solid", cursor: "pointer", background: catFilter === c.id ? "#7c3aed" : "#1e293b", borderColor: catFilter === c.id ? "#7c3aed" : "#334155", color: catFilter === c.id ? "#fff" : "#94a3b8" }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 28, height: 28, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : packages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569", fontSize: 13 }}>Không tìm thấy gói nào</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
            {packages.map(pkg => (
              <div key={pkg.id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Category + name */}
                <div>
                  <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 7, background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)", marginBottom: 8, display: "inline-block" }}>
                    {pkg.category_name}
                  </span>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 2px" }}>{pkg.name}</h3>
                  <p style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace", margin: 0 }}>{pkg.code}</p>
                </div>

                {/* Price */}
                <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px" }}>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>Phí bảo hiểm</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "#a78bfa", margin: "0 0 2px" }}>{formatMoney(pkg.price)}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>/ {CYCLE_LABEL[pkg.payment_cycle]}</p>
                </div>

                {/* Details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    ["BH tối đa", formatMoney(pkg.coverage_amount)],
                    ["Thời hạn",  `${pkg.duration_months} tháng`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: "#0f172a", borderRadius: 8, padding: "8px 12px" }}>
                      <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 2px" }}>{k}</p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "#fff", margin: 0 }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <button onClick={() => setDetailPkg(pkg)}
                    style={{ flex: 1, background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)", padding: "9px 0", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
                    Xem chi tiết
                  </button>
                  <button onClick={() => setRegisterPkg(pkg)}
                    style={{ flex: 1, background: "#7c3aed", color: "#fff", border: "none", padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    Đăng ký →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 12, color: "#475569", marginTop: 16 }}>{packages.length} gói bảo hiểm</p>
      </div>

      {/* Modals */}
      {detailPkg && (
        <PackageDetailModal
          pkg={detailPkg}
          onClose={() => setDetailPkg(null)}
          onRegister={pkg => { setDetailPkg(null); setRegisterPkg(pkg); }}
        />
      )}
      {registerPkg && (
        <RegisterModal
          pkg={registerPkg}
          onClose={() => setRegisterPkg(null)}
          onSuccess={data => { setRegisterPkg(null); setSuccessData(data); }}
        />
      )}
      {successData && (
        <SuccessModal data={successData} onClose={() => setSuccessData(null)} />
      )}
    </CustomerLayout>
  );
}