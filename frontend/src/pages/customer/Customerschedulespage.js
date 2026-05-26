import { useEffect, useState } from "react";
import CustomerLayout from "../../components/CustomerLayout";
import api from "../../services/api";

const STATUS_MAP = {
  pending:   { label: "Chờ xác nhận", bg: "rgba(234,179,8,0.1)",  color: "#facc15", border: "rgba(234,179,8,0.2)" },
  confirmed: { label: "Đã xác nhận",  bg: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  done:      { label: "Hoàn thành",   bg: "rgba(34,197,94,0.1)",  color: "#4ade80", border: "rgba(34,197,94,0.2)" },
  cancelled: { label: "Đã huỷ",       bg: "#334155",              color: "#94a3b8", border: "#475569" },
};

const STATUS_FILTERS = [
  { value: "",          label: "Tất cả" },
  { value: "pending",   label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "done",      label: "Hoàn thành" },
  { value: "cancelled", label: "Đã huỷ" },
];

function ScheduleCard({ schedule: s, onConfirm, onCancel, loading }) {
  const sm = STATUS_MAP[s.status];
  const dt = new Date(s.scheduled_at);
  const isPast     = dt < new Date();
  const canConfirm = s.status === "pending" && !isPast;
  const canCancel  = ["pending", "confirmed"].includes(s.status) && !isPast;

  return (
    <div style={{
      background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 20,
      display: "flex", gap: 18, opacity: ["done","cancelled"].includes(s.status) ? 0.75 : 1,
    }}>
      {/* Date box */}
      <div style={{ width: 60, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 4 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#a78bfa", margin: 0, lineHeight: 1 }}>{dt.getDate()}</p>
          <p style={{ fontSize: 10, color: "#a78bfa", margin: 0 }}>{dt.toLocaleString("vi-VN", { month: "short" })}</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>{s.title}</p>
          <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 8, background: sm?.bg, color: sm?.color, border: `1px solid ${sm?.border}`, flexShrink: 0, whiteSpace: "nowrap" }}>
            {sm?.label}
          </span>
        </div>

        {s.description && (
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 }}>{s.description}</p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: canConfirm || canCancel ? 14 : 0 }}>
          <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
            <svg style={{ width: 13, height: 13, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · {dt.toLocaleDateString("vi-VN")}
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
            <svg style={{ width: 13, height: 13, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            NV: {s.staff_name}
          </span>
          {isPast && !["done","cancelled"].includes(s.status) && (
            <span style={{ fontSize: 11, color: "#f87171", background: "rgba(239,68,68,0.08)", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)" }}>
              Đã qua
            </span>
          )}
        </div>

        {/* Action buttons — chỉ hiện khi có thể thao tác */}
        {(canConfirm || canCancel) && (
          <div style={{ display: "flex", gap: 8 }}>
            {canConfirm && (
              <button
                onClick={() => onConfirm(s.id)}
                disabled={loading === s.id}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(34,197,94,0.12)", color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.3)", padding: "7px 14px",
                  borderRadius: 10, fontSize: 13, fontWeight: 500,
                  cursor: loading === s.id ? "not-allowed" : "pointer",
                  opacity: loading === s.id ? 0.6 : 1, transition: "all 0.15s",
                }}>
                {loading === s.id
                  ? <div style={{ width: 13, height: 13, border: "2px solid rgba(74,222,128,0.3)", borderTopColor: "#4ade80", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  : <svg style={{ width: 14, height: 14, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                }
                Xác nhận
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(s.id)}
                disabled={loading === s.id}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(239,68,68,0.08)", color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.2)", padding: "7px 14px",
                  borderRadius: 10, fontSize: 13, fontWeight: 500,
                  cursor: loading === s.id ? "not-allowed" : "pointer",
                  opacity: loading === s.id ? 0.6 : 1, transition: "all 0.15s",
                }}>
                <svg style={{ width: 14, height: 14, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Huỷ lịch
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerSchedulesPage() {
  const [schedules, setSchedules]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // id đang xử lý
  const [toast, setToast]               = useState(null);   // { msg, type }

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSchedules = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    api.get(`/customer/schedules/?${params}`)
      .then(r => setSchedules(r.data.results ?? r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSchedules(); }, [statusFilter]);

  const handleConfirm = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/customer/schedules/${id}/confirm/`);
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: "confirmed" } : s));
      showToast("Đã xác nhận lịch hẹn!", "ok");
    } catch (err) {
      showToast(err.response?.data?.error || "Không thể xác nhận.", "err");
    } finally { setActionLoading(null); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn huỷ lịch hẹn này?")) return;
    setActionLoading(id);
    try {
      await api.post(`/customer/schedules/${id}/cancel/`);
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: "cancelled" } : s));
      showToast("Đã huỷ lịch hẹn.", "ok");
    } catch (err) {
      showToast(err.response?.data?.error || "Không thể huỷ.", "err");
    } finally { setActionLoading(null); }
  };

  const upcoming = schedules.filter(s => ["pending", "confirmed"].includes(s.status));
  const past     = schedules.filter(s => ["done", "cancelled"].includes(s.status));
  const pendingCount = schedules.filter(s => s.status === "pending").length;

  return (
    <CustomerLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 100,
          background: toast.type === "ok" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${toast.type === "ok" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: toast.type === "ok" ? "#4ade80" : "#f87171",
          padding: "12px 20px", borderRadius: 14, fontSize: 13, fontWeight: 500,
          animation: "fadeIn 0.3s ease",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>
          {toast.type === "ok" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      <div style={{ padding: 24, maxWidth: 860, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Lịch hẹn</h1>
            {pendingCount > 0 && (
              <span style={{ background: "#facc15", color: "#0f172a", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                {pendingCount} chờ xác nhận
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Quản lý lịch tư vấn với nhân viên phụ trách</p>
        </div>

        {/* Hướng dẫn khi có lịch pending */}
        {pendingCount > 0 && (
          <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>📅</span>
            <p style={{ fontSize: 13, color: "#fbbf24", margin: 0, lineHeight: 1.6 }}>
              Bạn có <strong>{pendingCount}</strong> lịch hẹn chờ xác nhận. Vui lòng xác nhận hoặc huỷ để nhân viên biết lịch của bạn.
            </p>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              style={{
                padding: "8px 14px", borderRadius: 12, fontSize: 13, border: "1px solid", cursor: "pointer",
                background: statusFilter === f.value ? "#7c3aed" : "#1e293b",
                borderColor: statusFilter === f.value ? "#7c3aed" : "#334155",
                color: statusFilter === f.value ? "#fff" : "#94a3b8",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 28, height: 28, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : schedules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#475569", fontSize: 13 }}>
            Chưa có lịch hẹn nào
          </div>
        ) : (
          <>
            {/* Sắp tới */}
            {upcoming.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
                  Sắp tới ({upcoming.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {upcoming.map(s => (
                    <ScheduleCard
                      key={s.id}
                      schedule={s}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                      loading={actionLoading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Đã qua */}
            {past.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
                  Đã qua ({past.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, opacity: 0.65 }}>
                  {past.map(s => (
                    <ScheduleCard
                      key={s.id}
                      schedule={s}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                      loading={actionLoading}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </CustomerLayout>
  );
}