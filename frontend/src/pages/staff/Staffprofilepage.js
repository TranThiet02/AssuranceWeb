import { useState } from "react";
import StaffLayout from "../../components/StaffLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function StaffProfilePage() {
  const { user, updateMe } = useAuth();

  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || "", phone: user?.phone || "" });
  const [passForm, setPassForm]       = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading]       = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [passMsg, setPassMsg]       = useState(null);

  const handleProfileChange = e => setProfileForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePassChange    = e => setPassForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleProfileSubmit = async e => {
    e.preventDefault(); setProfileLoading(true); setProfileMsg(null);
    try {
      const res = await api.patch("/auth/me/", profileForm);
      updateMe(res.data);
      setProfileMsg({ type: "ok", text: "Cập nhật thành công." });
    } catch (err) {
      const data = err.response?.data;
      setProfileMsg({ type: "err", text: typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra." });
    } finally { setProfileLoading(false); }
  };

  const handlePassSubmit = async e => {
    e.preventDefault(); setPassLoading(true); setPassMsg(null);
    try {
      await api.post("/auth/change-password/", passForm);
      setPassMsg({ type: "ok", text: "Đổi mật khẩu thành công." });
      setPassForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      const data = err.response?.data;
      setPassMsg({ type: "err", text: typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra." });
    } finally { setPassLoading(false); }
  };

  const inputStyle = { width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" };
  const disabledStyle = { ...inputStyle, background: "rgba(15,23,42,0.5)", color: "#475569", cursor: "not-allowed" };
  const cardStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 18, padding: 24, marginBottom: 16 };
  const labelStyle = { fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 };
  const fieldStyle = { display: "flex", flexDirection: "column", marginBottom: 14 };
  const saveBtnStyle = (loading) => ({
    background: "#0d9488", color: "#fff", border: "none", padding: "10px 20px",
    borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8,
  });

  return (
    <StaffLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24, maxWidth: 680, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Hồ sơ cá nhân</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Cập nhật thông tin và mật khẩu của bạn</p>
        </div>

        {/* Banner */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, flexShrink: 0 }}>
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 2px" }}>{user?.full_name}</p>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px" }}>{user?.email}</p>
              <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(13,148,136,0.15)", color: "#2dd4bf", border: "1px solid rgba(13,148,136,0.25)", padding: "3px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Nhân Viên
              </span>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 20px" }}>Thông tin cá nhân</h2>
          {profileMsg && (
            <div style={{ background: profileMsg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${profileMsg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: profileMsg.type === "ok" ? "#4ade80" : "#f87171", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 16 }}>
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={handleProfileSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input style={disabledStyle} value={user?.email} disabled />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Họ tên</label>
              <input style={inputStyle} type="text" name="full_name" value={profileForm.full_name} onChange={handleProfileChange} required />
            </div>
            <div style={{ ...fieldStyle, marginBottom: 0 }}>
              <label style={labelStyle}>Số điện thoại</label>
              <input style={inputStyle} type="text" name="phone" value={profileForm.phone} onChange={handleProfileChange} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <button type="submit" disabled={profileLoading} style={saveBtnStyle(profileLoading)}>
                {profileLoading && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 20px" }}>Đổi mật khẩu</h2>
          {passMsg && (
            <div style={{ background: passMsg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${passMsg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: passMsg.type === "ok" ? "#4ade80" : "#f87171", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 16 }}>
              {passMsg.text}
            </div>
          )}
          <form onSubmit={handlePassSubmit}>
            {[
              { name: "old_password",     label: "Mật khẩu hiện tại" },
              { name: "new_password",     label: "Mật khẩu mới" },
              { name: "confirm_password", label: "Xác nhận mật khẩu mới" },
            ].map(f => (
              <div key={f.name} style={fieldStyle}>
                <label style={labelStyle}>{f.label}</label>
                <input style={inputStyle} type="password" name={f.name} value={passForm[f.name]} onChange={handlePassChange} required minLength={f.name !== "old_password" ? 8 : undefined} />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button type="submit" disabled={passLoading} style={saveBtnStyle(passLoading)}>
                {passLoading && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                Đổi mật khẩu
              </button>
            </div>
          </form>
        </div>
      </div>
    </StaffLayout>
  );
}