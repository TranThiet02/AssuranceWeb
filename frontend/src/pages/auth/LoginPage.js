import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from '../../css/LoginPage.module.css'

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]         = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === "admin")      navigate("/admin/users");
      else if (user.role === "staff") navigate("/staff/customers");
      else                            navigate("/customer/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        "Đăng nhập thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className={styles.logoTitle}>Insurance</h1>
          <p className={styles.logoSubtitle}>Hệ thống quản lý bảo hiểm</p>
        </div>

        {/* Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Đăng nhập tài khoản</h2>

          {error && (
            <div className={styles.error}>
              <svg viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Email */}
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email" name="email" value={form.email}
                onChange={handleChange} required autoComplete="email"
                placeholder="name@company.com"
              />
            </div>

            {/* Password */}
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Mật khẩu</label>
                <a href="/forgot-password" className={styles.forgotLink}>Quên mật khẩu?</a>
              </div>
              <div className={styles.passwordWrapper}>
                <input
                  className={styles.input}
                  type={showPass ? "text" : "password"} name="password"
                  value={form.password} onChange={handleChange}
                  required autoComplete="current-password" placeholder="••••••••"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(p => !p)}>
                  {showPass ? (
                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading && <div className={styles.spinner} />}
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>

        <p className={styles.footer}>© {new Date().getFullYear()} Y Insurance</p>
      </div>
    </div>
  );
}