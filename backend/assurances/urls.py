from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.category_list, name='category-list'),
    path('categories/<uuid:id>/', views.category_detail, name='category-detail'),

    path('packages/', views.package_list, name='package-list'),
    path('packages/<uuid:id>/', views.package_detail, name='package-detail'),

    path('packages/<uuid:package_id>/processes/', views.process_list, name='process-list'),
    path('packages/<uuid:package_id>/processes/<uuid:process_id>/', views.process_detail, name='process-detail'),
]