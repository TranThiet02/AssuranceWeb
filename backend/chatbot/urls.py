from django.urls import path
from . import views

urlpatterns = [
    path('knowledge/', views.knowledge_list, name='knowledge-list'),
    path('knowledge/<uuid:id>/', views.knowledge_detail, name='knowledge-detail'),
    path('knowledge/<uuid:id>/reprocess/', views.knowledge_reprocess, name='knowledge-reprocess'),
    path('sessions/', views.chat_session_list, name='chat-session-list'),
    path('sessions/<uuid:id>/', views.chat_session_detail, name='chat-session-detail'),
    path('sessions/<uuid:session_id>/send/', views.chat_send_message, name='chat-send-message'),
    path('status/', views.knowledge_status, name='chatbot-status'),
]