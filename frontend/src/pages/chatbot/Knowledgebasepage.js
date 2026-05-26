import { useEffect, useRef, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

const STATUS_MAP = {
  pending:    { label: "Chờ xử lý",    color: "#94a3b8", bg: "#334155",              border: "#475569" },
  processing: { label: "Đang xử lý",   color: "#60a5fa", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
  ready:      { label: "Sẵn sàng",     color: "#4ade80", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.2)" },
  failed:     { label: "Lỗi",          color: "#f87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)" },
};

export default function KnowledgeBasePage() {
  const [docs, setDocs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm]           = useState({ title: "", description: "" });
  const [file, setFile]           = useState(null);
  const [error, setError]         = useState("");
  const [showForm, setShowForm]   = useState(false);
  const fileRef                   = useRef();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/chatbot/knowledge/");
      setDocs(res.data.results ?? res.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const docsRef = useRef(docs);
  useEffect(() => { docsRef.current = docs; }, [docs]);
 
  useEffect(() => {
    const interval = setInterval(() => {
      const hasProcessing = docsRef.current.some(
        d => d.status === "processing" || d.status === "pending"
      );
      if (hasProcessing) fetchDocs();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) { setError("Vui lòng chọn file PDF."); return; }
    if (!form.title.trim()) { setError("Vui lòng nhập tên tài liệu."); return; }

    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file",        file);
      fd.append("title",       form.title);
      fd.append("description", form.description);
      await api.post("/chatbot/knowledge/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm({ title: "", description: "" });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setShowForm(false);
      fetchDocs();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Upload thất bại.");
    } finally { setUploading(false); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xoá tài liệu "${title}"? Dữ liệu trong chatbot sẽ bị xoá.`)) return;
    await api.delete(`/chatbot/knowledge/${id}/`);
    fetchDocs();
  };

  const handleReprocess = async (id) => {
    await api.post(`/chatbot/knowledge/${id}/reprocess/`);
    fetchDocs();
  };

  const totalChunks = docs.filter(d => d.status === "ready").reduce((s, d) => s + d.chunk_count, 0);

  return (
    <AdminLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Knowledge Base – Chatbot</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Upload tài liệu PDF để chatbot học và trả lời khách hàng</p>
          </div>
          <button onClick={() => setShowForm(p => !p)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            <svg style={{ width: 16, height: 16, stroke: "#fff", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Upload PDF
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Tổng tài liệu",    value: docs.length,                                    color: "#fff" },
            { label: "Sẵn sàng",         value: docs.filter(d => d.status === "ready").length,    color: "#4ade80" },
            { label: "Đang xử lý",       value: docs.filter(d => d.status === "processing" || d.status === "pending").length, color: "#60a5fa" },
            { label: "Tổng chunks",      value: totalChunks,                                    color: "#a78bfa" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px" }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Upload form */}
        {showForm && (
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 18px" }}>Upload tài liệu mới</h2>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 }}>{error}</div>}
            <form onSubmit={handleUpload}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Tên tài liệu *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                    placeholder="VD: Quy trình bồi thường 2024"
                    style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Mô tả</label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Mô tả ngắn về nội dung tài liệu"
                    style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>File PDF *</label>
                <input ref={fileRef} type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])}
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#94a3b8", borderRadius: 12, padding: "10px 16px", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "#60a5fa", margin: 0 }}>
                  💡 Sau khi upload, hệ thống sẽ tự động tách text → tạo embeddings → lưu vào ChromaDB.
                  Quá trình này mất khoảng 10-30 giây tùy kích thước file.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: "#334155", color: "#94a3b8", border: "none", padding: 10, borderRadius: 12, fontSize: 13, cursor: "pointer" }}>Huỷ</button>
                <button type="submit" disabled={uploading}
                  style={{ flex: 1, background: "#2563eb", color: "#fff", border: "none", padding: 10, borderRadius: 12, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {uploading && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                  {uploading ? "Đang upload..." : "Upload & Xử lý"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Doc list */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155" }}>
                {["Tài liệu", "Trạng thái", "Chunks", "Ngày upload", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", padding: "14px 20px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 48 }}>
                  <div style={{ width: 24, height: 24, border: "2px solid #334155", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                </td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: "#475569", fontSize: 13 }}>
                  Chưa có tài liệu nào. Upload PDF để chatbot có thể trả lời khách hàng.
                </td></tr>
              ) : docs.map(doc => {
                const sm = STATUS_MAP[doc.status] || STATUS_MAP.pending;
                return (
                  <tr key={doc.id} style={{ borderBottom: "1px solid #263044" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg style={{ width: 18, height: 18, stroke: "#f87171", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: "0 0 2px" }}>{doc.title}</p>
                          {doc.description && <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{doc.description}</p>}
                          {doc.error_msg && <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{doc.error_msg}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 8, background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, display: "inline-flex", alignItems: "center", gap: 5 }}>
                        {doc.status === "processing" && (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: sm.color, animation: "pulse 1s infinite" }} />
                        )}
                        {sm.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: doc.chunk_count > 0 ? "#4ade80" : "#64748b" }}>
                      {doc.chunk_count > 0 ? `${doc.chunk_count} chunks` : "—"}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748b" }}>
                      {new Date(doc.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        {doc.status === "failed" && (
                          <button onClick={() => handleReprocess(doc.id)} title="Xử lý lại"
                            style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "none", cursor: "pointer", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg style={{ width: 15, height: 15, stroke: "currentColor", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                          </button>
                        )}
                        <button onClick={() => handleDelete(doc.id, doc.title)} title="Xoá"
                          style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg style={{ width: 15, height: 15, stroke: "#f87171", fill: "none" }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}