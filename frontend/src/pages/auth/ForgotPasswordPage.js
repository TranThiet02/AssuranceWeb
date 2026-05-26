import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../../css/ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/password-reset/", { email });
      setSent(true);
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <div className="forgot-header">
          <div className="forgot-logo">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
            </svg>
          </div>

          <h1 className="forgot-title">Y Insurance</h1>
          <p className="forgot-subtitle">Đặt lại mật khẩu</p>
        </div>

        <div className="forgot-card">
          {sent ? (
            <div className="success-box">
              <div className="success-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="success-title">Đã gửi email!</h3>

              <p className="success-text">
                Kiểm tra hộp thư <span>{email}</span> và làm theo hướng dẫn để
                đặt lại mật khẩu.
              </p>

              <Link to="/login" className="success-link">
                ← Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <h2>Quên mật khẩu?</h2>

              <p>
                Nhập email tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu.
              </p>

              {error && <div className="error-box">{error}</div>}

              <form onSubmit={handleSubmit} className="forgot-form">
                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn"
                >
                  {loading && <div className="spinner" />}

                  {loading ? "Đang gửi..." : "Gửi link đặt lại"}
                </button>
              </form>

              <Link to="/login" className="back-link">
                ← Quay lại đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}