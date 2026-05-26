from django.urls import path
from . import views

urlpatterns = [
    path('customers/', views.customer_list, name='customer-list'),
    path('customers/me/', views.my_profile, name='customer-my-profile'),
    path('customers/<uuid:id>/', views.customer_detail, name='customer-detail'),
    path('contracts/', views.contract_list, name='contract-list'),
    path('contracts/<uuid:id>/', views.contract_detail, name='contract-detail'),
    path('contracts/<uuid:id>/status/', views.contract_update_status, name='contract-update-status'),
    path('contracts/<uuid:contract_id>/documents/', views.contract_documents, name='contract-documents'),
    path('contracts/<uuid:contract_id>/documents/<uuid:doc_id>/', views.contract_document_detail, name='contract-document-detail'),
    path('customers/stats/', views.customer_stats,  name='customer-stats'),
]