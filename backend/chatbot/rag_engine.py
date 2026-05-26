import os
import re
from typing import List, Tuple
import pdfplumber
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from django.conf import settings as django_settings

_embedding_model = None
_chroma_client   = None
_chroma_collection = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    return _embedding_model

def get_chroma_collection():
    global _chroma_client, _chroma_collection
    if _chroma_collection is None:
        db_path = getattr(django_settings, "CHROMA_DB_PATH", "./chroma_db")
        _chroma_client = chromadb.PersistentClient(
            path=db_path,
            settings=Settings(anonymized_telemetry=False)
        )
        _chroma_collection = _chroma_client.get_or_create_collection(
            name="insurance_knowledge",
            metadata={"hnsw:space": "cosine"},
        )
    return _chroma_collection

def get_gemini_model():
    api_key = getattr(django_settings, "GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY", ""))
    genai.configure(api_key=api_key)
    model_name = getattr(django_settings, "GEMINI_MODEL", "gemini-3.5-flash")
    return genai.GenerativeModel(model_name)

def parse_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n\n"
    return text.strip()

def split_into_chunks(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) <= chunk_size:
            current += " " + sentence
        else:
            if current.strip():
                chunks.append(current.strip())
            overlap_text = current[-overlap:] if len(current) > overlap else current
            current = overlap_text + " " + sentence

    if current.strip():
        chunks.append(current.strip())

    return [c for c in chunks if len(c) > 50]

def ingest_document(doc_id: str, title: str, file_path: str) -> int:
    collection = get_chroma_collection()
    model = get_embedding_model()

    text = parse_pdf(file_path)
    if not text:
        raise ValueError("Không thể đọc nội dung từ PDF. File có thể bị scan (ảnh).")

    chunks = split_into_chunks(text)
    if not chunks:
        raise ValueError("Không có nội dung hợp lệ trong PDF.")

    try:
        existing = collection.get(where={"doc_id": doc_id})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
        pass

    embeddings = model.encode(chunks, batch_size=32, show_progress_bar=False).tolist()

    collection.add(
        ids=[f"{doc_id}_chunk_{i}" for i in range(len(chunks))],
        embeddings=embeddings,
        documents=chunks,
        metadatas=[{
            "doc_id":      doc_id,
            "doc_title":   title,
            "chunk_index": i,
        } for i in range(len(chunks))],
    )

    return len(chunks)

def delete_document(doc_id: str):
    collection = get_chroma_collection()
    try:
        existing = collection.get(where={"doc_id": doc_id})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
        pass

def retrieve_relevant_chunks(query: str, n_results: int = 5) -> List[Tuple[str, str]]:
    collection = get_chroma_collection()
    model = get_embedding_model()

    if collection.count() == 0:
        return []

    query_embedding = model.encode([query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(n_results, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        if dist < 0.7:
            chunks.append((doc, meta.get("doc_title", "Tài liệu công ty")))

    return chunks

def build_prompt(query: str, chunks: List[Tuple[str, str]], chat_history: List[dict]) -> str:
    context_parts = []
    seen_titles = set()
    for chunk_text, doc_title in chunks:
        context_parts.append(f"[Nguồn: {doc_title}]\n{chunk_text}")
        seen_titles.add(doc_title)
    context = "\n\n---\n\n".join(context_parts)

    history_text = ""
    if chat_history:
        recent = chat_history[-6:]
        history_lines = []
        for msg in recent:
            role = "Khách hàng" if msg["role"] == "user" else "Trợ lý"
            history_lines.append(f"{role}: {msg['content']}")
        history_text = "\n".join(history_lines)

    prompt = f"""Bạn là trợ lý chăm sóc khách hàng của công ty bảo hiểm Y Insurance.
Nhiệm vụ của bạn là trả lời câu hỏi của khách hàng DỰA TRÊN TÀI LIỆU ĐƯỢC CUNG CẤP BÊN DƯỚI.

QUY TẮC QUAN TRỌNG:
- CHỈ trả lời dựa trên thông tin có trong tài liệu bên dưới.
- Nếu câu hỏi không liên quan đến tài liệu, hãy nói: "Tôi không có thông tin về vấn đề này trong tài liệu công ty. Vui lòng liên hệ nhân viên phụ trách để được hỗ trợ."
- KHÔNG tự bịa ra thông tin không có trong tài liệu.
- Trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu.
- Nếu cần, hãy trích dẫn nguồn tài liệu.

TÀI LIỆU CÔNG TY:
{context if context else "Hiện chưa có tài liệu nào được nạp vào hệ thống."}

{"LỊCH SỬ HỘI THOẠI:" + chr(10) + history_text if history_text else ""}

CÂU HỎI CỦA KHÁCH HÀNG: {query}

TRẢ LỜI:"""

    return prompt

def ask_chatbot(query: str, chat_history: List[dict] = None) -> dict:
    if chat_history is None:
        chat_history = []

    chunks = retrieve_relevant_chunks(query, n_results=5)

    prompt = build_prompt(query, chunks, chat_history)

    gemini = get_gemini_model()
    response = gemini.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.3,
            max_output_tokens=1024,
        ),
    )

    answer = response.text.strip()

    sources = list(dict.fromkeys([title for _, title in chunks]))

    return {
        "answer": answer,
        "sources": sources,
        "found_context": len(chunks) > 0,
    }