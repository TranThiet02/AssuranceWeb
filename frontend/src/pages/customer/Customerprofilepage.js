import { useEffect, useState } from "react";
import CustomerLayout from "../../components/CustomerLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function CustomerProfilePage() {
  const { user, updateMe } = useAuth();

  const [profile, setProfile]         = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [profileMsg, setProfileMsg]   = useState(null);
  const [passMsg, setPassMsg]         = useState(null);

  const [form, setForm] = useState({
    full_name: user?.full_name || "", phone: user?.phone || "",
    date_of_birth: "", gender: "", address: "", city: "", id_number: "", occupation: "",
  });
  const [passForm, setPassForm] = useState({ old_password: "", new_password: "", confirm_password: "" });

  useEffect(() => {
    api.get("/customer/profile/").then(r => {
      setProfile(r.data);
      setForm(prev => ({
        ...prev,
        date_of_birth: r.data.date_of_birth || "",
        gender:        r.data.gender        || "",
        address:       r.data.address       || "",
        city:          r.data.city          || "",
        id_number:     r.data.id_number     || "",
        occupation:    r.data.occupation    || "",
      }));
    }).finally(() => setProfileLoading(false));
  }, []);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePassChange = e => setPassForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleProfileSubmit = async e => {
    e.preventDefault(); setSaving(true); setProfileMsg(null);
    try {
      // Cập nhật user (full_name, phone)
      const userRes = await api.patch("/auth/me/", { full_name: form.full_name, phone: form.phone });
      updateMe(userRes.data);
      // Cập nhật profile chi tiết
      await api.put("/customer/profile/", {
        date_of_birth: form.date_of_birth || null,
        gender: form.gender, address: form.address,
        city: form.city, id_number: form.id_number, occupation: form.occupation,
      });
      setProfileMsg({ type: "ok", text: "Cập nhật thông tin thành công." });
    } catch (err) {
      const data = err.response?.data;
      setProfileMsg({ type: "err", text: typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra." });
    } finally { setSaving(false); }
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

  const inputStyle = { width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const disabledStyle = { ...inputStyle, background: "rgba(15,23,42,0.5)", color: "#475569", cursor: "not-allowed" };
  const cardStyle  = { background: "#1e293b", border: "1px solid #334155", borderRadius: 18, padding: 24, marginBottom: 16 };
  const labelStyle = { fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 };
  const fieldStyle = { marginBottom: 14 };
  const gridStyle  = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };
  const msgStyle   = (t) => ({ background: t === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${t === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: t === "ok" ? "#4ade80" : "#f87171", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 16 });
  const saveBtnStyle = (loading) => ({ background: "#7c3aed", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 });

  return (
    <CustomerLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Hồ sơ cá nhân</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Cập nhật thông tin cá nhân và mật khẩu</p>
        </div>

        {/* Banner */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, flexShrink: 0 }}>
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 2px" }}>{user?.full_name}</p>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px" }}>{user?.email}</p>
              <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)", padding: "3px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Khách Hàng
              </span>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 20px" }}>Thông tin cá nhân</h2>
          {profileMsg && <div style={msgStyle(profileMsg.type)}>{profileMsg.text}</div>}

          {profileLoading ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ width: 24, height: 24, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit}>
              <div style={{ ...fieldStyle }}>
                <label style={labelStyle}>Email</label>
                <input style={disabledStyle} value={user?.email} disabled />
              </div>
              <div style={gridStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Họ tên</label>
                  <input style={inputStyle} name="full_name" value={form.full_name} onChange={handleChange} required />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Số điện thoại</label>
                  <input style={inputStyle} name="phone" value={form.phone} onChange={handleChange} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Ngày sinh</label>
                  <input style={inputStyle} type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Giới tính</label>
                  <select style={inputStyle} name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">-- Chọn --</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>CCCD/CMND</label>
                  <input style={inputStyle} name="id_number" value={form.id_number} onChange={handleChange} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Nghề nghiệp</label>
                  <input style={inputStyle} name="occupation" value={form.occupation} onChange={handleChange} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Thành phố</label>
                  <input style={inputStyle} name="city" value={form.city} onChange={handleChange} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Địa chỉ</label>
                  <input style={inputStyle} name="address" value={form.address} onChange={handleChange} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                <button type="submit" disabled={saving} style={saveBtnStyle(saving)}>
                  {saving && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Change password */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 20px" }}>Đổi mật khẩu</h2>
          {passMsg && <div style={msgStyle(passMsg.type)}>{passMsg.text}</div>}
          <form onSubmit={handlePassSubmit}>
            {[
              { name: "old_password",     label: "Mật khẩu hiện tại" },
              { name: "new_password",     label: "Mật khẩu mới (tối thiểu 8 ký tự)" },
              { name: "confirm_password", label: "Xác nhận mật khẩu mới" },
            ].map(f => (
              <div key={f.name} style={fieldStyle}>
                <label style={labelStyle}>{f.label}</label>
                <input style={inputStyle} type="password" name={f.name} value={passForm[f.name]} onChange={handlePassChange} required minLength={f.name !== "old_password" ? 8 : undefined} />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={passLoading} style={saveBtnStyle(passLoading)}>
                {passLoading && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                Đổi mật khẩu
              </button>
            </div>
          </form>
        </div>
      </div>
    </CustomerLayout>
  );
}