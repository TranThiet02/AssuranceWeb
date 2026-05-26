from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
 
urlpatterns = [
    path('auth/login/',views.login,name='auth-login'),
    path('auth/logout/',views.logout,name='auth-logout'),
    path('auth/token/refresh/',TokenRefreshView.as_view(),   name='auth-token-refresh'),
    path('auth/me/',views.me,name='auth-me'),
    path('auth/change-password/',views.change_password,name='auth-change-password'),
    path('auth/password-reset/',views.request_password_reset, name='auth-password-reset'),
    path('auth/password-reset/confirm/',views.confirm_password_reset, name='auth-password-reset-confirm'),
 
    path('users/',views.user_list,name='user-list'),
    path('users/<uuid:id>/',views.user_detail,name='user-detail'),
    path('users/<uuid:id>/reset-password/', views.user_reset_password, name='user-reset-password'),
    path('users/<uuid:id>/logs/',views.user_logs,name='user-logs'),
 
    path('access-logs/',views.access_log_list,name='access-log-list'),
]