import uuid
from django.db import models
from django.conf import settings

class KnowledgeDocument(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Chờ xử lý"
        PROCESSING = "processing", "Đang xử lý"
        READY = "ready", "Sẵn sàng"
        FAILED = "failed", "Lỗi"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to="knowledge/")
    description = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    chunk_count = models.IntegerField(default=0)
    error_msg = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "knowledge_documents"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} [{self.status}]"


class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_sessions")
    title = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_sessions"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Session {self.user.full_name} – {self.title or self.id}"


class ChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = "user", "Khách hàng"
        ASSISTANT = "assistant", "Chatbot"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    sources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}"