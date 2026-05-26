from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.staff_dashboard, name='staff-dashboard'),
    path('list/', views.staff_list, name='staff-list'),
    path('assignments/', views.assignment_list, name='assignment-list'),
    path('assignments/<uuid:id>/', views.assignment_detail, name='assignment-detail'),
    path('schedules/', views.schedule_list, name='schedule-list'),
    path('schedules/<uuid:id>/', views.schedule_detail, name='schedule-detail'),
]