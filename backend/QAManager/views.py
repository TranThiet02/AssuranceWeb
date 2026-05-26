import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Contract, ContractDocument, CustomerProfile
from .serializers import (ContractDocumentSerializer, ContractListSerializer, ContractSerializer, CustomerProfileSerializer)


def is_admin(user): return user.role == "admin"
def is_staff(user): return user.role == "staff"
def is_admin_or_staff(u): return u.role in ("admin", "staff")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_list(request):
    if not is_admin_or_staff(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    profiles = CustomerProfile.objects.select_related('user').all()
    search = request.query_params.get('search', None)
    city = request.query_params.get('city', None)

    if search:
        profiles = profiles.filter(user__full_name__icontains=search) | profiles.filter(user__email__icontains=search) | profiles.filter(id_number__icontains=search)
    if city:
        profiles = profiles.filter(city__icontains=city)

    serializer = CustomerProfileSerializer(profiles, many=True)
    return Response(serializer.data)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def customer_detail(request, id):
    try:
        profile = CustomerProfile.objects.select_related('user').get(id=id)
    except CustomerProfile.DoesNotExist:
        return Response({'error': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)

    if not is_admin_or_staff(request.user) and request.user != profile.user:
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = CustomerProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    try:
        profile = CustomerProfile.objects.select_related('user').get(user=request.user)
    except CustomerProfile.DoesNotExist:
        profile = CustomerProfile.objects.create(user=request.user)

    serializer = CustomerProfileSerializer(profile)
    return Response(serializer.data)

def generate_contract_number():
    return f"HD-{uuid.uuid4().hex[:8].upper()}"

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def contract_list(request):
    if request.method == 'GET':
        if request.user.role == 'customer':
            contracts = Contract.objects.filter(customer=request.user).select_related('customer', 'package', 'staff')
        elif request.user.role == 'staff':
            contracts = Contract.objects.all().select_related('customer', 'package', 'staff')
        else:
            contracts = Contract.objects.all().select_related('customer', 'package', 'staff')

        status_ = request.query_params.get('status', None)
        package = request.query_params.get('package', None)
        customer = request.query_params.get('customer', None)
        search = request.query_params.get('search', None)

        if status_: 
            contracts = contracts.filter(status=status_)
        if package: 
            contracts = contracts.filter(package_id=package)
        if customer: 
            contracts = contracts.filter(customer_id=customer)
        if search:
            contracts = contracts.filter(contract_number__icontains=search) | contracts.filter(customer__full_name__icontains=search)

        contracts = contracts.order_by('-created_at')
        serializer = ContractListSerializer(contracts, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not is_admin_or_staff(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['contract_number'] = generate_contract_number()

        if is_staff(request.user) and not data.get('staff'):
            data['staff'] = str(request.user.id)

        serializer = ContractSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def contract_detail(request, id):
    try:
        contract = Contract.objects.select_related('customer', 'package', 'staff').prefetch_related('documents').get(id=id)
    except Contract.DoesNotExist:
        return Response({'error': 'Không tìm thấy hợp đồng.'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role == 'customer' and contract.customer != request.user:
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
    if request.user.role == 'staff' and contract.staff != request.user:
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = ContractSerializer(contract)
        return Response(serializer.data)

    elif request.method == 'PUT':
        if not is_admin_or_staff(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ContractSerializer(contract, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not is_admin(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        contract.status = 'cancelled'
        contract.save()
        return Response({'message': 'Đã huỷ hợp đồng.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def contract_update_status(request, id):
    if not is_admin_or_staff(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        contract = Contract.objects.get(id=id)
    except Contract.DoesNotExist:
        return Response({'error': 'Không tìm thấy hợp đồng.'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    valid = [s[0] for s in Contract.Status.choices]
    if new_status not in valid:
        return Response({'error': f'Trạng thái không hợp lệ. Chọn: {valid}'}, status=status.HTTP_400_BAD_REQUEST)

    contract.status = new_status
    if request.data.get('note'):
        contract.note = request.data['note']
    contract.save()
    return Response(ContractSerializer(contract).data)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def contract_documents(request, contract_id):
    try:
        contract = Contract.objects.get(id=contract_id)
    except Contract.DoesNotExist:
        return Response({'error': 'Không tìm thấy hợp đồng.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        docs = contract.documents.all()
        return Response(ContractDocumentSerializer(docs, many=True).data)

    elif request.method == 'POST':
        if not is_admin_or_staff(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ContractDocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(contract=contract, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def contract_document_detail(request, contract_id, doc_id):
    if not is_admin_or_staff(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        doc = ContractDocument.objects.get(id=doc_id, contract_id=contract_id)
    except ContractDocument.DoesNotExist:
        return Response({'error': 'Không tìm thấy tài liệu.'}, status=status.HTTP_404_NOT_FOUND)
    doc.delete()
    return Response({'message': 'Đã xoá tài liệu.'})


# ──────────────────────────────────────────────────────────────
#  STATS (dùng cho dashboard)
# ──────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_stats(request):
    """Thống kê nhanh cho admin dashboard."""
    if not is_admin(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    from django.contrib.auth import get_user_model
    User = get_user_model()

    total_customers  = User.objects.filter(role='customer', is_active=True).count()
    total_contracts  = Contract.objects.count()
    active_contracts = Contract.objects.filter(status='active').count()
    pending_contracts = Contract.objects.filter(status='pending').count()

    return Response({
        'total_customers':   total_customers,
        'total_contracts':   total_contracts,
        'active_contracts':  active_contracts,
        'pending_contracts': pending_contracts,
    })