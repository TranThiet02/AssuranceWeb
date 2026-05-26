from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from assurances.models import InsuranceCategory, InsurancePackage
from assurances.serializers import InsuranceCategorySerializer, InsurancePackageSerializer, InsurancePackageListSerializer
from QAManager.models import Contract, CustomerProfile
from QAManager.serializers import ContractSerializer, ContractListSerializer, CustomerProfileSerializer
from staff.models import StaffAssignment, StaffSchedule
from staff.models import StaffSchedule
from staff.serializers import StaffScheduleSerializer
from datetime import date
from dateutil.relativedelta import relativedelta
from staff.models import StaffSchedule
import uuid

def is_customer(user): return user.role == "customer"

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_dashboard(request):
    if not is_customer(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    contracts = Contract.objects.filter(customer=request.user)

    try:
        assignment = StaffAssignment.objects.filter(customer=request.user, is_active=True).select_related('staff').first()
        assigned_staff = {
            "id": str(assignment.staff.id),
            "full_name": assignment.staff.full_name,
            "email": assignment.staff.email,
            "phone": assignment.staff.phone,
        } if assignment else None

        upcoming_schedules = StaffSchedule.objects.filter(customer=request.user, status__in=["pending", "confirmed"]).order_by("scheduled_at").count()
    except Exception:
        assigned_staff = None
        upcoming_schedules = 0

    return Response({
        "total_contracts": contracts.count(),
        "active_contracts": contracts.filter(status="active").count(),
        "pending_contracts": contracts.filter(status="pending").count(),
        "expired_contracts": contracts.filter(status="expired").count(),
        "assigned_staff": assigned_staff,
        "upcoming_schedules": upcoming_schedules,
    })

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    if not is_customer(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    profile, _ = CustomerProfile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response(CustomerProfileSerializer(profile).data)

    serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def package_list_customer(request):
    packages = InsurancePackage.objects.filter(status='active').select_related('category')

    category = request.query_params.get('category', None)
    search = request.query_params.get('search', None)

    if category:
        packages = packages.filter(category_id=category)
    if search:
        packages = packages.filter(name__icontains=search) | packages.filter(code__icontains=search)

    serializer = InsurancePackageListSerializer(packages, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def package_detail_customer(request, id):
    try:
        package = InsurancePackage.objects.filter(status='active').prefetch_related('processes').get(id=id)
    except InsurancePackage.DoesNotExist:
        return Response({'error': 'Không tìm thấy gói bảo hiểm.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(InsurancePackageSerializer(package).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_contracts(request):
    contracts = Contract.objects.filter(customer=request.user).select_related('package', 'staff').order_by('-created_at')

    status_ = request.query_params.get('status', None)
    if status_: 
        contracts = contracts.filter(status=status_)

    serializer = ContractListSerializer(contracts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_contract_detail(request, id):
    try:
        contract = Contract.objects.select_related('package', 'staff').prefetch_related('documents').get(id=id, customer=request.user)
    except Contract.DoesNotExist:
        return Response({'error': 'Không tìm thấy hợp đồng.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(ContractSerializer(contract).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_schedules(request):
    if not is_customer(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        schedules = StaffSchedule.objects.filter(customer=request.user).select_related('staff', 'customer').order_by('scheduled_at')
        status_ = request.query_params.get('status', None)
        if status_:
            schedules = schedules.filter(status=status_)
        return Response(StaffScheduleSerializer(schedules, many=True).data)
    except Exception:
        return Response([])
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_package(request):
    if not is_customer(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
    
    package_id = request.data.get('package_id')
    if not package_id:
        return Response({'error': 'Vui lòng chọn gói bảo hiểm.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        package = InsurancePackage.objects.get(id=package_id, status='active')
    except InsurancePackage.DoesNotExist:
        return Response({'error': 'Gói bảo hiểm không tồn tại hoạt không còn hoạt động.'}, status=status.HTTP_404_NOT_FOUND)
    
    existing = Contract.objects.filter(customer=request.user, package=package, status__in=['pending', 'active']).first()
    if existing:
        return Response({'error': f'Bạn đã có hợp đồng {existing.get_status_display()} với gói này. Mã HĐ: {existing.contract_number}.'})
    
    start_date_str = request.data.get('start_date')
    try:
        start_date = date.fromisoformat(start_date_str) if start_date_str else date.today()
    except ValueError:
        return Response({'error': 'Ngày bắt đầu không hợp lệ. Định dạng: YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    
    end_date = start_date + relativedelta(month=package.duration_months)

    assigned_staff = None
    try:
        assignment = StaffAssignment.objects.filter(customer=request.user, is_active=True).select_related('staff').first()
        if assignment:
            assigned_staff = assignment.staff
    except Exception:
        pass
    
    contract_number = f"HĐ - {uuid.uuid4().hex[:8].upper()}"

    contract = Contract.objects.create(contract_number = contract_number, customer = request.user, package= package, staff = assigned_staff,
                                       status = Contract.Status.PENDING, start_date = start_date, end_date = end_date, premium_amount = package.price, note = request.data.get('note', ''))

    return Response({'message': 'Yêu cầu đăng kí được gửi thành công! Nhân viên sẽ liên hệ để xác nhận.', 'contract': ContractSerializer(contract).data}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_package_registration(request, package_id):
    if not is_customer(request.user):
        return Response({'register': False})
    
    contract = Contract.objects.filter(customer=request.user, package_id=package_id, status__in=['pending', 'activate']).first()

    if contract:
        return Response({'register': True, 'status': contract.status, 'contract_number': contract.contract_number, 'status_display': contract.get_status_display()})
    return Response({'register': False})
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_schedule(request, schedule_id):
    if request.user.role != "customer":
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
 
    try:
        schedule = StaffSchedule.objects.get(id=schedule_id, customer=request.user)
    except Exception:
        return Response({'error': 'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)
 
    if schedule.status != "pending":
        return Response({'error': f'Lịch hẹn đang ở trạng thái "{schedule.status}", không thể xác nhận.'}, status=status.HTTP_400_BAD_REQUEST)
 
    schedule.status = "confirmed"
    schedule.save(update_fields=["status"])
    return Response({'message': 'Đã xác nhận lịch hẹn.', 'status': 'confirmed'})
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_schedule(request, schedule_id):
    if request.user.role != "customer":
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
 
    try:
        schedule = StaffSchedule.objects.get(id=schedule_id, customer=request.user)
    except Exception:
        return Response({'error': 'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)
 
    if schedule.status in ("done", "cancelled"):
        return Response({'error': f'Lịch hẹn đã "{schedule.status}", không thể huỷ.'}, status=status.HTTP_400_BAD_REQUEST)
 
    schedule.status = "cancelled"
    schedule.save(update_fields=["status"])
    return Response({'message': 'Đã huỷ lịch hẹn.', 'status': 'cancelled'})