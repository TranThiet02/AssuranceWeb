from rest_framework import serializers
from .models import KnowledgeDocument, ChatSession, ChatMessage

class KnowledgeDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.full_name", read_only=True)

    class Meta:
        model = KnowledgeDocument
        fields = [
            "id", "title", "file", "description", "status",
            "chunk_count", "error_msg", "uploaded_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "chunk_count", "error_msg", "created_at", "updated_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "role", "content", "sources", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model  = ChatSession
        fields = ["id", "title", "message_count", "messages", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_message_count(self, obj):
        return obj.messages.count()


class ChatSessionListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message  = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ["id", "title", "message_count", "last_message", "created_at", "updated_at"]

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        return last.content[:80] if last else ""