import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import styles from "../../css/ProfilePage.module.css";

const ROLE_LABEL = { admin: "Admin", staff: "Staff", customer: "Customer" };

export default function ProfilePage() {
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
    e.preventDefault();
    setProfileLoading(true); setProfileMsg(null);
    try {
      const res = await api.patch("/auth/me/", profileForm);
      updateMe(res.data);
      setProfileMsg({ type: "ok", text: "Cập nhật thông tin thành công." });
    } catch (err) {
      const data = err.response?.data;
      setProfileMsg({ type: "err", text: typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra." });
    } finally { setProfileLoading(false); }
  };

  const handlePassSubmit = async e => {
    e.preventDefault();
    setPassLoading(true); setPassMsg(null);
    try {
      await api.post("/auth/change-password/", passForm);
      setPassMsg({ type: "ok", text: "Đổi mật khẩu thành công." });
      setPassForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      const data = err.response?.data;
      setPassMsg({ type: "err", text: typeof data === "object" ? Object.values(data).flat().join(" ") : "Có lỗi xảy ra." });
    } finally { setPassLoading(false); }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Hồ sơ cá nhân</h1>
          <p>Cập nhật thông tin và mật khẩu của bạn</p>
        </div>

        <div className={styles.card}>
          <div className={styles.userBanner}>
            <div className={styles.bigAvatar}>{user?.full_name?.[0]?.toUpperCase()}</div>
            <div>
              <div className={styles.bannerName}>{user?.full_name}</div>
              <div className={styles.bannerEmail}>{user?.email}</div>
              <span className={styles.roleBadge}>{ROLE_LABEL[user?.role]}</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Thông tin cá nhân</h2>
          {profileMsg && <div className={profileMsg.type === "ok" ? styles.alertOk : styles.alertErr}>{profileMsg.text}</div>}
          <form className={styles.form} onSubmit={handleProfileSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={styles.inputDisabled} value={user?.email} disabled />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Họ tên</label>
              <input className={styles.input} type="text" name="full_name" value={profileForm.full_name} onChange={handleProfileChange} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Số điện thoại</label>
              <input className={styles.input} type="text" name="phone" value={profileForm.phone} onChange={handleProfileChange} />
            </div>
            <div className={styles.formFooter}>
              <button type="submit" disabled={profileLoading} className={styles.saveBtn}>
                {profileLoading && <div className={styles.spinner} />}
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Đổi mật khẩu</h2>
          {passMsg && <div className={passMsg.type === "ok" ? styles.alertOk : styles.alertErr}>{passMsg.text}</div>}
          <form className={styles.form} onSubmit={handlePassSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Mật khẩu hiện tại</label>
              <input className={styles.input} type="password" name="old_password" value={passForm.old_password} onChange={handlePassChange} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Mật khẩu mới</label>
              <input className={styles.input} type="password" name="new_password" value={passForm.new_password} onChange={handlePassChange} required minLength={8} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Xác nhận mật khẩu mới</label>
              <input className={styles.input} type="password" name="confirm_password" value={passForm.confirm_password} onChange={handlePassChange} required />
            </div>
            <div className={styles.formFooter}>
              <button type="submit" disabled={passLoading} className={styles.saveBtn}>
                {passLoading && <div className={styles.spinner} />}
                Đổi mật khẩu
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}