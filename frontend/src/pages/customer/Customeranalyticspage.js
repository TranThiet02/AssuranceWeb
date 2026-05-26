import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import CustomerLayout from "../../components/CustomerLayout";
import api from "../../services/api";

const formatMoney = n => Number(n).toLocaleString("vi-VN") + " đ";
const COLORS = ["#4ade80", "#facc15", "#94a3b8", "#f87171", "#a78bfa"];
const tooltipStyle = { background: "#0f172a", border: "1px solid #334155", borderRadius: 10, fontSize: 12 };

const StatCard = ({ label, value, color = "#fff" }) => (
  <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: "18px 20px" }}>
    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px" }}>{label}</p>
    <p style={{ fontSize: 26, fontWeight: 700, color, margin: 0 }}>{value}</p>
  </div>
);

const ChartCard = ({ title, children, height = 260 }) => (
  <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 22 }}>
    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 20px" }}>{title}</p>
    <div style={{ height }}>{children}</div>
  </div>
);

export default function CustomerAnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/customer/").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <CustomerLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ width: 32, height: 32, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
    </CustomerLayout>
  );

  const { overview, status_distribution, premium_by_package } = data;

  return (
    <CustomerLayout>
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Thống kê của tôi</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Tổng quan hợp đồng bảo hiểm cá nhân</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard label="Tổng hợp đồng"  value={overview.total_contracts}   color="#fff" />
          <StatCard label="Đang hiệu lực"  value={overview.active_contracts}  color="#4ade80" />
          <StatCard label="Chờ duyệt"      value={overview.pending_contracts} color="#facc15" />
          <StatCard label="Tổng phí BH"    value={formatMoney(overview.total_premium)} color="#a78bfa" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Pie chart trạng thái */}
          <ChartCard title="Phân bố trạng thái hợp đồng">
            {status_distribution.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#475569", fontSize: 13 }}>Chưa có hợp đồng</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={status_distribution} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={100} innerRadius={55}
                    label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                    labelLine={false} fontSize={12}>
                    {status_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Bar chart phí theo gói */}
          <ChartCard title="Phí bảo hiểm theo gói">
            {premium_by_package.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#475569", fontSize: 13 }}>Chưa có hợp đồng</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={premium_by_package} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={v => formatMoney(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} width={100} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [formatMoney(v), "Phí BH"]} />
                  <Bar dataKey="premium" radius={[0, 6, 6, 0]} name="Phí BH">
                    {premium_by_package.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </CustomerLayout>
  );
}