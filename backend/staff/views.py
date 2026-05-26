from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import StaffAssignment, StaffSchedule
from .serializers import StaffAssignmentSerializer, StaffScheduleSerializer
from QAManager.models import Contract
from django.contrib.auth import get_user_model

def is_admin(user): return user.role == "admin"
def is_staff(user): return user.role == "staff"
def is_admin_or_staff(user): return user.role in ("admin", "staff")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_dashboard(request):
    if not is_staff(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    total_customers = StaffAssignment.objects.filter(staff=request.user, is_active=True).count()
    active_contracts = Contract.objects.filter(staff=request.user, status="active").count()
    pending_schedules = StaffSchedule.objects.filter(staff=request.user, status="pending").count()

    # Pending incidents (nếu module incident đã có)
    try:
        from incidents.models import IncidentReport
        pending_incidents = IncidentReport.objects.filter(assigned_staff=request.user, status="open").count()
    except Exception:
        pending_incidents = 0

    return Response({
        "total_customers":   total_customers,
        "active_contracts":  active_contracts,
        "pending_schedules": pending_schedules,
        "pending_incidents": pending_incidents,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_list(request):
    if not is_admin(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    User = get_user_model()

    staff_users = User.objects.filter(role="staff", is_active=True)
    search = request.query_params.get('search', None)
    if search:
        staff_users = staff_users.filter(full_name__icontains=search) | staff_users.filter(email__icontains=search)

    result = []
    for s in staff_users:
        customer_count = StaffAssignment.objects.filter(staff=s, is_active=True).count()
        result.append({
            "id": str(s.id),
            "full_name": s.full_name,
            "email": s.email,
            "phone": s.phone,
            "customer_count": customer_count,
        })
    return Response(result)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def assignment_list(request):
    if request.method == 'GET':
        if is_staff(request.user):
            assignments = StaffAssignment.objects.filter(staff=request.user, is_active=True).select_related('staff', 'customer')
        elif is_admin(request.user):
            assignments = StaffAssignment.objects.all().select_related('staff', 'customer', 'assigned_by')
            staff_id = request.query_params.get('staff', None)
            if staff_id:
                assignments = assignments.filter(staff_id=staff_id)
        else:
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

        search = request.query_params.get('search', None)
        if search:
            assignments = assignments.filter(customer__full_name__icontains=search) | assignments.filter(customer__email__icontains=search)

        serializer = StaffAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not is_admin(request.user):
            return Response({'error': 'Chỉ admin mới được phân công.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = StaffAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(assigned_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def assignment_detail(request, id):
    try:
        assignment = StaffAssignment.objects.select_related('staff', 'customer').get(id=id)
    except StaffAssignment.DoesNotExist:
        return Response({'error': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if not is_admin(request.user) and assignment.staff != request.user:
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(StaffAssignmentSerializer(assignment).data)

    elif request.method == 'PUT':
        if not is_admin(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = StaffAssignmentSerializer(assignment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not is_admin(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        assignment.is_active = False
        assignment.save()
        return Response({'message': 'Đã huỷ phân công.'})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def schedule_list(request):
    if request.method == 'GET':
        if is_staff(request.user):
            schedules = StaffSchedule.objects.filter(staff=request.user).select_related('staff', 'customer')
        elif request.user.role == 'customer':
            schedules = StaffSchedule.objects.filter(customer=request.user).select_related('staff', 'customer')
        elif is_admin(request.user):
            schedules = StaffSchedule.objects.all().select_related('staff', 'customer')
            staff_id = request.query_params.get('staff', None)
            if staff_id:
                schedules = schedules.filter(staff_id=staff_id)
        else:
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

        status_ = request.query_params.get('status', None)
        if status_:
            schedules = schedules.filter(status=status_)

        serializer = StaffScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not is_admin_or_staff(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        if is_staff(request.user):
            data['staff'] = str(request.user.id)

        serializer = StaffScheduleSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def schedule_detail(request, id):
    try:
        schedule = StaffSchedule.objects.select_related('staff', 'customer').get(id=id)
    except StaffSchedule.DoesNotExist:
        return Response({'error': 'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if not is_admin(request.user) and schedule.staff != request.user and schedule.customer != request.user:
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(StaffScheduleSerializer(schedule).data)

    elif request.method == 'PUT':
        if not is_admin_or_staff(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = StaffScheduleSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not is_admin_or_staff(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        schedule.status = 'cancelled'
        schedule.save()
        return Response({'message': 'Đã huỷ lịch hẹn.'})