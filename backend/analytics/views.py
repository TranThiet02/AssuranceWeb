from datetime import timedelta
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from QAManager.models import Contract
from django.contrib.auth import get_user_model
from QAManager.models import Contract
from staff.models import StaffAssignment, StaffSchedule


def is_admin(u): return u.role == "admin"
def is_staff(u): return u.role == "staff"
def is_customer(u): return u.role == "customer"

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_analytics(request):
    if not is_admin(request.user):
        return Response({'error': 'Không có quyền.'}, status=403)
    User = get_user_model()

    now = timezone.now()
    ago_6m = now - timedelta(days=180)
    ago_30d = now - timedelta(days=30)

    overview = {
        "total_users": User.objects.filter(is_active=True).count(),
        "total_customers": User.objects.filter(role="customer", is_active=True).count(),
        "total_staff": User.objects.filter(role="staff", is_active=True).count(),
        "total_contracts": Contract.objects.count(),
        "active_contracts": Contract.objects.filter(status="active").count(),
        "pending_contracts": Contract.objects.filter(status="pending").count(),
        "total_revenue": Contract.objects.filter(status="active").aggregate(t=Sum("premium_amount"))["t"] or 0,
        "new_customers_30d": User.objects.filter(role="customer", date_joined__gte=ago_30d).count(),
    }

    contracts_by_month = list(Contract.objects.filter(created_at__gte=ago_6m).annotate(month=TruncMonth("created_at")).values("month").annotate(count=Count("id"), revenue=Sum("premium_amount")).order_by("month"))
    contracts_by_month_fmt = [
        {
            "month":   c["month"].strftime("%m/%Y"),
            "count":   c["count"],
            "revenue": float(c["revenue"] or 0),
        }
        for c in contracts_by_month
    ]

    status_dist = list(Contract.objects.values("status").annotate(count=Count("id")).order_by("status"))
    status_labels = {"pending":"Chờ duyệt","active":"Hiệu lực","expired":"Hết hạn","cancelled":"Đã huỷ","rejected":"Từ chối"}
    status_dist_fmt = [{"name": status_labels.get(s["status"], s["status"]), "value": s["count"]} for s in status_dist]

    top_packages = list(Contract.objects.values("package__name", "package__code").annotate(count=Count("id"), revenue=Sum("premium_amount")).order_by("-count")[:5])
    top_packages_fmt = [
        {
            "name": p["package__name"],
            "code": p["package__code"],
            "count": p["count"],
            "revenue": float(p["revenue"] or 0),
        }
        for p in top_packages
    ]

    new_users_daily = list(User.objects.filter(role="customer", date_joined__gte=ago_30d).annotate(day=TruncDate("date_joined")).values("day").annotate(count=Count("id")).order_by("day"))
    new_users_fmt = [{"day": u["day"].strftime("%d/%m"), "count": u["count"]} for u in new_users_daily]

    staff_perf = list(Contract.objects.filter(staff__isnull=False).values("staff__full_name").annotate(contracts=Count("id"), revenue=Sum("premium_amount")).order_by("-contracts")[:8])
    staff_perf_fmt = [
        {
            "name": s["staff__full_name"],
            "contracts": s["contracts"],
            "revenue": float(s["revenue"] or 0),
        }
        for s in staff_perf
    ]

    return Response({
        "overview": overview,
        "contracts_by_month": contracts_by_month_fmt,
        "status_distribution": status_dist_fmt,
        "top_packages": top_packages_fmt,
        "new_users_daily": new_users_fmt,
        "staff_performance": staff_perf_fmt,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_analytics(request):
    if not is_staff(request.user):
        return Response({'error': 'Không có quyền.'}, status=403)
    now = timezone.now()
    ago_6m = now - timedelta(days=180)

    total_customers = StaffAssignment.objects.filter(staff=request.user, is_active=True).count()
    my_contracts = Contract.objects.all()
    active_contracts = my_contracts.filter(status="active").count()
    total_revenue = my_contracts.filter(status="active").aggregate(t=Sum("premium_amount"))["t"] or 0

    contracts_by_month = list(my_contracts.filter(created_at__gte=ago_6m).annotate(month=TruncMonth("created_at")).values("month").annotate(count=Count("id")).order_by("month"))
    contracts_by_month_fmt = [
        {"month": c["month"].strftime("%m/%Y"), "count": c["count"]}
        for c in contracts_by_month
    ]

    status_dist = list(my_contracts.values("status").annotate(count=Count("id")))
    status_labels = {"pending":"Chờ duyệt","active":"Hiệu lực","expired":"Hết hạn","cancelled":"Đã huỷ","rejected":"Từ chối"}
    status_dist_fmt = [{"name": status_labels.get(s["status"], s["status"]), "value": s["count"]} for s in status_dist]

    schedule_dist = list(StaffSchedule.objects.filter(staff=request.user).values("status").annotate(count=Count("id")))
    sched_labels = {"pending":"Chờ xác nhận","confirmed":"Đã xác nhận","done":"Hoàn thành","cancelled":"Đã huỷ"}
    schedule_dist_fmt = [{"name": sched_labels.get(s["status"], s["status"]), "value": s["count"]} for s in schedule_dist]

    return Response({
        "overview": {
            "total_customers": total_customers,
            "active_contracts": active_contracts,
            "total_contracts": my_contracts.count(),
            "total_revenue": float(total_revenue),
            "pending_schedules": StaffSchedule.objects.filter(staff=request.user, status="pending").count(),
        },
        "contracts_by_month":  contracts_by_month_fmt,
        "status_distribution": status_dist_fmt,
        "schedule_distribution": schedule_dist_fmt,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_analytics(request):
    if not is_customer(request.user):
        return Response({'error': 'Không có quyền.'}, status=403)

    my_contracts = Contract.objects.filter(customer=request.user).select_related("package")

    status_dist = list(my_contracts.values("status").annotate(count=Count("id")))
    status_labels = {"pending":"Chờ duyệt","active":"Hiệu lực","expired":"Hết hạn","cancelled":"Đã huỷ","rejected":"Từ chối"}
    status_dist_fmt = [{"name": status_labels.get(s["status"], s["status"]), "value": s["count"]} for s in status_dist]

    premium_by_pkg = [
        {
            "name":    c.package.name,
            "premium": float(c.premium_amount),
            "status":  c.status,
        }
        for c in my_contracts
    ]

    total_premium = my_contracts.filter(status="active").aggregate(t=Sum("premium_amount"))["t"] or 0

    return Response({
        "overview": {
            "total_contracts": my_contracts.count(),
            "active_contracts": my_contracts.filter(status="active").count(),
            "pending_contracts": my_contracts.filter(status="pending").count(),
            "total_premium": float(total_premium),
        },
        "status_distribution": status_dist_fmt,
        "premium_by_package": premium_by_pkg,
    })