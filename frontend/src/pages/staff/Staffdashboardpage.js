import { useEffect, useState } from "react";
import StaffLayout from "../../components/StaffLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const card = (bg, border, color) => ({
  background: bg, border: `1px solid ${border}`,
  borderRadius: 16, padding: "20px 22px",
});

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]           = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [schedules, setSchedules]   = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/staff/dashboard/"),
      api.get("/staff/assignments/?is_active=true"),
      api.get("/staff/schedules/?status=pending"),
    ]).then(([s, a, sc]) => {
      setStats(s.data);
      setAssignments((a.data.results ?? a.data).slice(0, 5));
      setSchedules((sc.data.results ?? sc.data).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: "Khách hàng phụ trách", value: stats.total_customers,   bg: "rgba(37,99,235,0.08)",   border: "rgba(37,99,235,0.2)",   color: "#60a5fa" },
    { label: "HĐ đang hiệu lực",     value: stats.active_contracts,  bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",   color: "#4ade80" },
    { label: "Lịch hẹn chờ duyệt",   value: stats.pending_schedules, bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.2)",   color: "#facc15" },
    { label: "Sự cố chờ xử lý",      value: stats.pending_incidents, bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",   color: "#f87171" },
  ] : [];

  return (
    <StaffLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Xin chào, {user?.full_name} 👋</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Đây là tổng quan công việc hôm nay của bạn</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <div style={{ width: 28, height: 28, border: "2px solid #334155", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
              {statCards.map(s => (
                <div key={s.label} style={card(s.bg, s.border, s.color)}>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px" }}>{s.label}</p>
                  <p style={{ fontSize: 30, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Khách hàng gần đây */}
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Khách hàng được phân công</h2>
                  <a href="/staff/customers" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none" }}>Xem tất cả →</a>
                </div>
                {assignments.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "24px 0" }}>Chưa có khách hàng nào</p>
                ) : assignments.map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #263044" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                      {a.customer_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{a.customer_name}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{a.customer_email}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lịch hẹn sắp tới */}
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Lịch hẹn chờ xác nhận</h2>
                  <a href="/staff/schedules" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none" }}>Xem tất cả →</a>
                </div>
                {schedules.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "24px 0" }}>Không có lịch hẹn chờ</p>
                ) : schedules.map(s => (
                  <div key={s.id} style={{ padding: "10px 0", borderBottom: "1px solid #263044" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>{s.title}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                      {s.customer_name} · {new Date(s.scheduled_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
}