import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import StaffLayout from "../../components/StaffLayout";
import api from "../../services/api";

const formatMoney = n => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " tỷ";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + " tr";
  return Number(n).toLocaleString("vi-VN");
};

const COLORS = ["#0d9488", "#2563eb", "#f59e0b", "#ef4444", "#7c3aed"];
const tooltipStyle = { background: "#0f172a", border: "1px solid #334155", borderRadius: 10, fontSize: 12 };

const StatCard = ({ label, value, color = "#fff", sub }) => (
  <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: "18px 20px" }}>
    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px" }}>{label}</p>
    <p style={{ fontSize: 26, fontWeight: 700, color, margin: "0 0 2px" }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{sub}</p>}
  </div>
);

const ChartCard = ({ title, children, height = 260 }) => (
  <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 22 }}>
    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 20px" }}>{title}</p>
    <div style={{ height }}>{children}</div>
  </div>
);

export default function StaffAnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("analytics/staff/").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <StaffLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ width: 32, height: 32, border: "2px solid #334155", borderTopColor: "#0d9488", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
    </StaffLayout>
  );

  const { overview, contracts_by_month, status_distribution, schedule_distribution } = data;

  return (
    <StaffLayout>
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Dashboard của tôi</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Thống kê hiệu suất cá nhân</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard label="Khách hàng phụ trách" value={overview.total_customers}  color="#2dd4bf" />
          <StatCard label="HĐ đang hiệu lực"      value={overview.active_contracts}  color="#4ade80" />
          <StatCard label="Tổng hợp đồng"          value={overview.total_contracts}   color="#fff" />
          <StatCard label="Doanh thu HĐ active"    value={formatMoney(overview.total_revenue) + " đ"} color="#60a5fa" />
        </div>

        {/* Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
          <ChartCard title="Hợp đồng theo tháng (6 tháng gần nhất)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={contracts_by_month}>
                <defs>
                  <linearGradient id="colorStaff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#0d9488" fill="url(#colorStaff)" name="Hợp đồng" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Trạng thái hợp đồng">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={status_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
                  labelLine={false} fontSize={11}>
                  {status_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 2 */}
        <ChartCard title="Lịch hẹn theo trạng thái">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={schedule_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Số lịch hẹn">
                {schedule_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </StaffLayout>
  );
}