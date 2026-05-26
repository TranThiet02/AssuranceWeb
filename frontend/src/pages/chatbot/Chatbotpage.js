import { useEffect, useRef, useState } from "react";
import CustomerLayout from "../../components/CustomerLayout";
import api from "../../services/api";

/**
 * ChatbotPage – Giao diện chat với RAG chatbot
 *
 * Layout gồm 2 phần:
 *   - Sidebar trái: danh sách sessions (lịch sử chat)
 *   - Phần phải: cửa sổ chat hiện tại
 */

// ── Helper components ─────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>🤖</div>
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px 12px 12px 4px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c3aed", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
      {/* Avatar */}
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: isUser ? "#334155" : "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
        {isUser ? "👤" : "🤖"}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          background: isUser ? "#7c3aed" : "#1e293b",
          border: isUser ? "none" : "1px solid #334155",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          padding: "12px 16px",
          fontSize: 13,
          color: "#fff",
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {msg.content}
        </div>

        {/* Sources */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: 6, display: "flex", gap: 5, flexWrap: "wrap" }}>
            {msg.sources.map((src, i) => (
              <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}>
                📄 {src}
              </span>
            ))}
          </div>
        )}

        <p style={{ fontSize: 11, color: "#475569", margin: "4px 0 0" }}>
          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function ChatbotPage() {
  const [sessions, setSessions]       = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [sending, setSending]         = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [botReady, setBotReady]       = useState(null); // null = loading
  const messagesEndRef                = useRef(null);

  // Auto scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Load sessions + kiểm tra chatbot đã có data chưa
  useEffect(() => {
    Promise.all([
      api.get("/chatbot/sessions/"),
      api.get("/chatbot/status/"),
    ]).then(([sessRes, statusRes]) => {
      setSessions(sessRes.data.results ?? sessRes.data);
      setBotReady(statusRes.data.ready);
    }).finally(() => setLoadingSessions(false));
  }, []);

  // Load messages khi chọn session
  const handleSelectSession = async (session) => {
    setActiveSession(session);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chatbot/sessions/${session.id}/`);
      setMessages(res.data.messages || []);
    } catch { /* handled */ }
    finally { setLoadingMessages(false); }
  };

  // Tạo session mới
  const handleNewSession = async () => {
    try {
      const res = await api.post("/chatbot/sessions/");
      const newSession = res.data;
      setSessions(prev => [newSession, ...prev]);
      setActiveSession(newSession);
      setMessages([]);
    } catch { /* handled */ }
  };

  // Xoá session
  const handleDeleteSession = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Xoá cuộc trò chuyện này?")) return;
    await api.delete(`/chatbot/sessions/${id}/`);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession?.id === id) {
      setActiveSession(null);
      setMessages([]);
    }
  };

  // Gửi tin nhắn
  const handleSend = async () => {
    if (!input.trim() || sending) return;

    let session = activeSession;

    // Nếu chưa có session, tạo mới
    if (!session) {
      try {
        const res = await api.post("/chatbot/sessions/");
        session = res.data;
        setSessions(prev => [session, ...prev]);
        setActiveSession(session);
      } catch { return; }
    }

    const question = input.trim();
    setInput("");
    setSending(true);

    // Hiển thị tin nhắn user ngay lập tức (optimistic update)
    const tempUserMsg = {
      id: "temp_user",
      role: "user",
      content: question,
      sources: [],
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.post(`/chatbot/sessions/${session.id}/send/`, { message: question });
      const { user_message, bot_message } = res.data;

      // Thay tin nhắn tạm bằng tin nhắn thật
      setMessages(prev => [
        ...prev.filter(m => m.id !== "temp_user"),
        user_message,
        bot_message,
      ]);

      // Cập nhật title session trong sidebar
      setSessions(prev => prev.map(s =>
        s.id === session.id
          ? { ...s, title: question.slice(0, 60), updated_at: new Date().toISOString() }
          : s
      ));
    } catch {
      // Hiển thị lỗi nếu call thất bại
      setMessages(prev => [
        ...prev.filter(m => m.id !== "temp_user"),
        { id: "temp_user_real", role: "user", content: question, sources: [], created_at: new Date().toISOString() },
        { id: "error", role: "assistant", content: "Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.", sources: [], created_at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <CustomerLayout>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* ── Sidebar sessions ── */}
        <div style={{ width: 280, borderRight: "1px solid #334155", display: "flex", flexDirection: "column", flexShrink: 0, background: "#1a2332" }}>
          <div style={{ padding: "16px 14px", borderBottom: "1px solid #334155" }}>
            <button onClick={handleNewSession}
              style={{ width: "100%", background: "#7c3aed", color: "#fff", border: "none", padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg style={{ width: 15, height: 15, stroke: "#fff", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Cuộc trò chuyện mới
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
            {loadingSessions ? (
              <div style={{ textAlign: "center", padding: 24 }}>
                <div style={{ width: 20, height: 20, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
              </div>
            ) : sessions.length === 0 ? (
              <p style={{ fontSize: 12, color: "#475569", textAlign: "center", padding: "20px 12px" }}>Chưa có cuộc trò chuyện nào</p>
            ) : sessions.map(s => (
              <div key={s.id} onClick={() => handleSelectSession(s)}
                style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  background: activeSession?.id === s.id ? "rgba(124,58,237,0.15)" : "transparent",
                  border: activeSession?.id === s.id ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                  transition: "all 0.15s" }}
                onMouseEnter={e => { if (activeSession?.id !== s.id) e.currentTarget.style.background = "#1e293b"; }}
                onMouseLeave={e => { if (activeSession?.id !== s.id) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: "#fff", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title || "Cuộc trò chuyện mới"}
                  </p>
                  <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>
                    {s.message_count} tin · {new Date(s.updated_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <button onClick={e => handleDeleteSession(s.id, e)}
                  style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "none", cursor: "pointer", color: "#475569", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <svg style={{ width: 13, height: 13, stroke: "#f87171", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>Trợ lý Y Insurance</p>
              <p style={{ fontSize: 12, color: botReady ? "#4ade80" : "#f87171", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: botReady ? "#4ade80" : "#f87171", display: "inline-block" }} />
                {botReady === null ? "Đang kiểm tra..." : botReady ? "Sẵn sàng hỗ trợ" : "Chưa có tài liệu — liên hệ admin"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 16px" }}>
            {!activeSession ? (
              /* Welcome screen */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>Xin chào! Tôi có thể giúp gì cho bạn?</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 28px", maxWidth: 400 }}>
                  Hỏi tôi về các gói bảo hiểm, quy trình bồi thường, điều khoản hợp đồng hoặc bất kỳ thắc mắc nào về Y Insurance.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 500 }}>
                  {[
                    "Quy trình đăng ký bảo hiểm như thế nào?",
                    "Tôi cần giấy tờ gì để bồi thường?",
                    "Gói bảo hiểm sức khoẻ có những quyền lợi gì?",
                    "Thời gian xét duyệt hồ sơ mất bao lâu?",
                  ].map(q => (
                    <button key={q} onClick={() => { setInput(q); }}
                      style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", padding: "12px 14px", borderRadius: 12, fontSize: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s", lineHeight: 1.5 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94a3b8"; }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : loadingMessages ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                <div style={{ width: 24, height: 24, border: "2px solid #334155", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#475569", fontSize: 13 }}>
                    Bắt đầu cuộc trò chuyện bằng cách nhập câu hỏi bên dưới.
                  </div>
                )}
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                {sending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid #334155" }}>
            {!botReady && botReady !== null && (
              <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 12, color: "#facc15" }}>
                ⚠️ Chatbot chưa có tài liệu. Vui lòng liên hệ admin để upload tài liệu công ty.
              </div>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)"
                rows={1}
                style={{
                  flex: 1, background: "#1e293b", border: "1px solid #334155", color: "#fff",
                  borderRadius: 14, padding: "12px 16px", fontSize: 13, outline: "none",
                  resize: "none", maxHeight: 120, overflowY: "auto", fontFamily: "inherit",
                  lineHeight: 1.6, transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.6)"}
                onBlur={e => e.target.style.borderColor = "#334155"}
              />
              <button onClick={handleSend} disabled={sending || !input.trim()}
                style={{ width: 44, height: 44, borderRadius: 12, background: input.trim() && !sending ? "#7c3aed" : "#334155", border: "none", cursor: input.trim() && !sending ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
                {sending
                  ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  : <svg style={{ width: 18, height: 18, stroke: "#fff", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                }
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#334155", margin: "8px 0 0", textAlign: "center" }}>
              Chatbot chỉ trả lời dựa trên tài liệu của Y Insurance
            </p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}