import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import styles from "../../css/AccessLogsPage.module.css";

const ACTIONS = [
  { value: "", label: "Tất cả" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "login_failed", label: "Login Failed" },
  { value: "password_reset", label: "Password Reset" },
];

const ACTION_LABEL = {
  login: "Login", logout: "Logout",
  login_failed: "Login Failed", password_reset: "Password Reset", token_refresh: "Token Refresh",
};

function actionBadgeClass(action) {
  if (action === "login")          return styles.badgeLogin;
  if (action === "logout")         return styles.badgeLogout;
  if (action === "login_failed")   return styles.badgeFailed;
  if (action === "password_reset") return styles.badgeReset;
  if (action === "token_refresh")  return styles.badgeRefresh;
  return styles.badgeLogout;
}

export default function AccessLogsPage() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction]   = useState("");
  const [date, setDate]       = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (action) params.append("action", action);
      if (date)   params.append("date", date);
      const res = await api.get(`/access-logs/?${params}`);
      setLogs(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [action, date]);

  const today = new Date().toDateString();

  return (
    <AdminLayout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Access Logs</h1>
          <p>Lịch sử đăng nhập và hoạt động của người dùng</p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {ACTIONS.map(a => (
            <button key={a.value}
              className={`${styles.filterBtn} ${action === a.value ? styles.active : ""}`}
              onClick={() => setAction(a.value)}>
              {a.label}
            </button>
          ))}
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={styles.dateInput} />
          {(action || date) && (
            <button className={styles.clearBtn} onClick={() => { setAction(""); setDate(""); }}>
              Xoá bộ lọc
            </button>
          )}
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <p>Tổng</p>
            <p className={styles.statTotal}>{logs.length}</p>
          </div>
          <div className={styles.statCard}>
            <p>Login OK</p>
            <p className={styles.statGreen}>{logs.filter(l => l.action === "login").length}</p>
          </div>
          <div className={styles.statCard}>
            <p>Login Failed</p>
            <p className={styles.statRed}>{logs.filter(l => l.action === "login_failed").length}</p>
          </div>
          <div className={styles.statCard}>
            <p>Hôm nay</p>
            <p className={styles.statBlue}>{logs.filter(l => new Date(l.timestamp).toDateString() === today).length}</p>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Hành động</th>
                <th>Thời gian</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className={styles.tableCenter}><div className={styles.spinner} /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className={styles.tableCenter}>Không có log nào</td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td className={styles.emailText}>{log.email}</td>
                  <td>
                    <span className={`${styles.badge} ${actionBadgeClass(log.action)}`}>
                      {ACTION_LABEL[log.action] || log.action}
                    </span>
                  </td>
                  <td className={styles.dateText}>{new Date(log.timestamp).toLocaleString("vi-VN")}</td>
                  <td className={styles.noteText}>{log.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.tableFooter}>{logs.length} bản ghi</p>
      </div>
    </AdminLayout>
  );
}