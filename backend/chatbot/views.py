import threading
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import KnowledgeDocument, ChatSession, ChatMessage
from .serializers import (KnowledgeDocumentSerializer, ChatSessionSerializer, ChatSessionListSerializer, ChatMessageSerializer)
from .rag_engine import ask_chatbot, ingest_document, delete_document

def is_admin(u): return u.role == "admin"

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def knowledge_list(request):
    if not is_admin(request.user):
        return Response({'error': 'Không có quyền.'}, status=403)

    if request.method == 'GET':
        docs = KnowledgeDocument.objects.all()
        return Response(KnowledgeDocumentSerializer(docs, many=True).data)

    elif request.method == 'POST':
        serializer = KnowledgeDocumentSerializer(data=request.data)
        if serializer.is_valid():
            doc = serializer.save(uploaded_by=request.user, status=KnowledgeDocument.Status.PENDING)

            def process_in_background():
                try:
                    doc.status = KnowledgeDocument.Status.PROCESSING
                    doc.save(update_fields=["status"])

                    chunk_count = ingest_document(doc_id=str(doc.id), title=doc.title, file_path=doc.file.path)

                    doc.status = KnowledgeDocument.Status.READY
                    doc.chunk_count = chunk_count
                    doc.save(update_fields=["status", "chunk_count"])

                except Exception as e:
                    doc.status = KnowledgeDocument.Status.FAILED
                    doc.error_msg = str(e)
                    doc.save(update_fields=["status", "error_msg"])

            thread = threading.Thread(target=process_in_background, daemon=True)
            thread.start()

            return Response(
                KnowledgeDocumentSerializer(doc).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def knowledge_detail(request, id):
    if not is_admin(request.user):
        return Response({'error': 'Không có quyền.'}, status=403)

    try:
        doc = KnowledgeDocument.objects.get(id=id)
    except KnowledgeDocument.DoesNotExist:
        return Response({'error': 'Không tìm thấy tài liệu.'}, status=404)

    if request.method == 'GET':
        return Response(KnowledgeDocumentSerializer(doc).data)

    elif request.method == 'DELETE':
        delete_document(str(doc.id))
        if doc.file:
            try:
                doc.file.delete(save=False)
            except Exception:
                pass
        doc.delete()
        return Response({'message': 'Đã xoá tài liệu.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def knowledge_reprocess(request, id):
    if not is_admin(request.user):
        return Response({'error': 'Không có quyền.'}, status=403)

    try:
        doc = KnowledgeDocument.objects.get(id=id)
    except KnowledgeDocument.DoesNotExist:
        return Response({'error': 'Không tìm thấy.'}, status=404)

    def reprocess():
        try:
            doc.status = KnowledgeDocument.Status.PROCESSING
            doc.error_msg = ""
            doc.save(update_fields=["status", "error_msg"])

            chunk_count = ingest_document(str(doc.id), doc.title, doc.file.path)

            doc.status = KnowledgeDocument.Status.READY
            doc.chunk_count = chunk_count
            doc.save(update_fields=["status", "chunk_count"])
        except Exception as e:
            doc.status = KnowledgeDocument.Status.FAILED
            doc.error_msg = str(e)
            doc.save(update_fields=["status", "error_msg"])

    threading.Thread(target=reprocess, daemon=True).start()
    return Response({'message': 'Đang xử lý lại...'})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def chat_session_list(request):
    if request.method == 'GET':
        sessions = ChatSession.objects.filter(user=request.user)
        return Response(ChatSessionListSerializer(sessions, many=True).data)

    elif request.method == 'POST':
        session = ChatSession.objects.create(user=request.user, title="Cuộc trò chuyện mới")
        return Response(ChatSessionSerializer(session).data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def chat_session_detail(request, id):
    try:
        session = ChatSession.objects.prefetch_related('messages').get(id=id, user=request.user)
    except ChatSession.DoesNotExist:
        return Response({'error': 'Không tìm thấy session.'}, status=404)

    if request.method == 'GET':
        return Response(ChatSessionSerializer(session).data)

    elif request.method == 'DELETE':
        session.delete()
        return Response({'message': 'Đã xoá cuộc trò chuyện.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_send_message(request, session_id):
    try:
        session = ChatSession.objects.get(id=session_id, user=request.user)
    except ChatSession.DoesNotExist:
        return Response({'error': 'Không tìm thấy session.'}, status=404)

    question = request.data.get('message', '').strip()
    if not question:
        return Response({'error': 'Tin nhắn không được để trống.'}, status=400)

    user_msg = ChatMessage.objects.create(session=session, role=ChatMessage.Role.USER, content=question)

    history_qs = session.messages.order_by('-created_at')[1:11]
    history = [{"role": m.role, "content": m.content} for m in reversed(list(history_qs))]

    try:
        result = ask_chatbot(question, chat_history=history)
        answer = result["answer"]
        sources = result["sources"]
    except Exception as e:
        answer  = "Xin lỗi, hiện tại hệ thống đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ nhân viên phụ trách."
        sources = []

    bot_msg = ChatMessage.objects.create(session=session, role=ChatMessage.Role.ASSISTANT, content=answer, sources=sources)

    if session.title == "Cuộc trò chuyện mới":
        session.title = question[:80]
        session.save(update_fields=["title"])

    return Response({
        "user_message": ChatMessageSerializer(user_msg).data,
        "bot_message":  ChatMessageSerializer(bot_msg).data,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def knowledge_status(request):
    ready_count = KnowledgeDocument.objects.filter(status=KnowledgeDocument.Status.READY).count()
    return Response({
        "ready": ready_count > 0,
        "doc_count": ready_count,
    })