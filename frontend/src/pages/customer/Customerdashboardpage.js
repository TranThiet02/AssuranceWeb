import { useEffect, useState } from "react";
import CustomerLayout from "../../components/CustomerLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const formatMoney = n => Number(n).toLocaleString("vi-VN") + " đ";

const STATUS_STYLE = {
  active:    { bg: "rgba(34,197,94,0.1)",  color: "#4ade80", border: "rgba(34,197,94,0.2)" },
  pending:   { bg: "rgba(234,179,8,0.1)",  color: "#facc15", border: "rgba(234,179,8,0.2)" },
  expired:   { bg: "#334155",              color: "#94a3b8", border: "#475569" },
  cancelled: { bg: "#334155",              color: "#94a3b8", border: "#475569" },
};
const STATUS_LABEL = { active:"Đang hiệu lực", pending:"Chờ duyệt", expired:"Hết hạn", cancelled:"Đã huỷ" };

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]         = useState(null);
  const [contracts, setContracts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/customer/dashboard/"),
      api.get("/customer/contracts/"),
      api.get("/customer/schedules/?status=pending"),
    ]).then(([s, c, sc]) => {
      setStats(s.data);
      setContracts((c.data.results ?? c.data).slice(0, 3));
      setSchedules((sc.data.results ?? sc.data).slice(0, 3));
    }).finally(() => setLoading(false));
  }, []);

  const S = { fontFamily: "'Segoe UI',sans-serif", color: "#fff" };
  const card = (bg, border) => ({ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "18px 20px" });

  return (
    <CustomerLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", ...S }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Xin chào, {user?.full_name} 👋</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Tổng quan tài khoản bảo hiểm của bạn</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 28, height: 28, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
              {[
                { label: "Tổng hợp đồng",    value: stats?.total_contracts,   color: "#fff" },
                { label: "Đang hiệu lực",     value: stats?.active_contracts,  color: "#4ade80" },
                { label: "Chờ duyệt",         value: stats?.pending_contracts, color: "#facc15" },
                { label: "Lịch hẹn sắp tới",  value: stats?.upcoming_schedules, color: "#a78bfa" },
              ].map(s => (
                <div key={s.label} style={card("rgba(124,58,237,0.06)", "rgba(124,58,237,0.15)")}>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px" }}>{s.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0 }}>{s.value ?? 0}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
              {/* Contracts */}
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Hợp đồng gần đây</h2>
                  <a href="/customer/contracts" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none" }}>Xem tất cả →</a>
                </div>
                {contracts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "#475569", fontSize: 13 }}>
                    <p style={{ margin: "0 0 12px" }}>Bạn chưa có hợp đồng nào</p>
                    <a href="/customer/packages" style={{ color: "#a78bfa", fontSize: 13 }}>Xem các gói bảo hiểm →</a>
                  </div>
                ) : contracts.map(c => (
                  <div key={c.id} style={{ padding: "12px 0", borderBottom: "1px solid #263044", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", margin: "0 0 2px" }}>{c.contract_number}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{c.package_name}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 8, background: STATUS_STYLE[c.status]?.bg, color: STATUS_STYLE[c.status]?.color, border: `1px solid ${STATUS_STYLE[c.status]?.border}` }}>
                        {STATUS_LABEL[c.status]}
                      </span>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>{formatMoney(c.premium_amount)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Staff + Schedules */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Nhân viên phụ trách */}
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 20 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Nhân viên phụ trách</h2>
                  {stats?.assigned_staff ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                        {stats.assigned_staff.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{stats.assigned_staff.full_name}</p>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0" }}>{stats.assigned_staff.email}</p>
                        {stats.assigned_staff.phone && <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{stats.assigned_staff.phone}</p>}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "12px 0" }}>Chưa có nhân viên phụ trách</p>
                  )}
                </div>

                {/* Lịch hẹn */}
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Lịch hẹn sắp tới</h2>
                    <a href="/customer/schedules" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none" }}>Xem tất cả →</a>
                  </div>
                  {schedules.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "12px 0" }}>Không có lịch hẹn</p>
                  ) : schedules.map(s => (
                    <div key={s.id} style={{ padding: "8px 0", borderBottom: "1px solid #263044" }}>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>{s.title}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{new Date(s.scheduled_at).toLocaleString("vi-VN")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}