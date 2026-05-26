from django.urls import path
from . import views

urlpatterns = [
    path('admin/', views.admin_analytics, name='analytics-admin'),
    path('staff/', views.staff_analytics, name='analytics-staff'),
    path('customer/', views.customer_analytics, name='analytics-customer'),
]