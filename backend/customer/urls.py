from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.customer_dashboard, name='customer-dashboard'),
    path('profile/', views.my_profile, name='customer-profile'),
    path('packages/', views.package_list_customer, name='customer-package-list'),
    path('packages/<uuid:id>/', views.package_detail_customer, name='customer-package-detail'),
    path('contracts/', views.my_contracts, name='customer-contracts'),
    path('contracts/<uuid:id>/', views.my_contract_detail, name='customer-contract-detail'),
    path('schedules/', views.my_schedules, name='customer-schedules'),
    path('register-package/', views.register_package, name='customer-register'),
    path('packages/<uuid:package_id>/check-registration/', views.check_package_registration, name='customer-check-registration'),
     path('schedules/', views.my_schedules,name='customer-schedules'),
    path('schedules/<uuid:schedule_id>/confirm/', views.confirm_schedule, name='customer-confirm-schedule'),
    path('schedules/<uuid:schedule_id>/cancel/', views.cancel_schedule, name='customer-cancel-schedule'),
]