import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

const formatMoney = n => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " tỷ";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + " tr";
  return Number(n).toLocaleString("vi-VN");
};

const COLORS = ["#7c3aed","#2563eb","#0d9488","#f59e0b","#ef4444","#ec4899"];

const StatCard = ({ label, value, sub, color = "#fff" }) => (
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

const tooltipStyle = { background: "#0f172a", border: "1px solid #334155", borderRadius: 10, fontSize: 12 };

export default function AdminAnalyticsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/admin/").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ width: 32, height: 32, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
    </AdminLayout>
  );

  const { overview, contracts_by_month, status_distribution, top_packages, new_users_daily, staff_performance } = data;

  return (
    <AdminLayout>
      <div style={{ padding: 24, maxWidth: 1300, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Dashboard Analytics</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Tổng quan toàn hệ thống</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard label="Tổng khách hàng"  value={overview.total_customers}   color="#a78bfa" sub={`+${overview.new_customers_30d} trong 30 ngày`} />
          <StatCard label="Hợp đồng hiệu lực" value={overview.active_contracts}  color="#4ade80" />
          <StatCard label="Chờ duyệt"          value={overview.pending_contracts} color="#facc15" />
          <StatCard label="Doanh thu hiệu lực" value={formatMoney(overview.total_revenue) + " đ"} color="#60a5fa" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard label="Tổng người dùng"   value={overview.total_users}      color="#fff" />
          <StatCard label="Tổng nhân viên"    value={overview.total_staff}      color="#2dd4bf" />
          <StatCard label="Tổng hợp đồng"     value={overview.total_contracts}  color="#f9a8d4" />
        </div>

        {/* Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
          <ChartCard title="Hợp đồng theo tháng (6 tháng gần nhất)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={contracts_by_month}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#7c3aed" fill="url(#colorCount)" name="Hợp đồng" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Phân bố trạng thái HĐ">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={status_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {status_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <ChartCard title="Khách hàng mới theo ngày (30 ngày)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={new_users_daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Khách hàng mới" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 5 gói bảo hiểm bán chạy">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top_packages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis type="category" dataKey="code" tick={{ fontSize: 11, fill: "#64748b" }} width={80} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => n === "count" ? [v + " HĐ", "Số HĐ"] : [formatMoney(v) + " đ", "Doanh thu"]} />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} name="count" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3 - Staff performance */}
        {staff_performance.length > 0 && (
          <ChartCard title="Hiệu suất nhân viên (theo số hợp đồng)" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staff_performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => formatMoney(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => n === "contracts" ? [v + " HĐ", "Hợp đồng"] : [formatMoney(v) + " đ", "Doanh thu"]} />
                <Legend formatter={v => v === "contracts" ? "Số HĐ" : "Doanh thu"} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Bar yAxisId="left"  dataKey="contracts" fill="#7c3aed" radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="revenue"   fill="#0d9488" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </AdminLayout>
  );
}