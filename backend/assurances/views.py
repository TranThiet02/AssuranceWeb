from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import InsuranceCategory, InsurancePackage, PackageProcess
from .serializers import (InsuranceCategorySerializer, InsurancePackageListSerializer, InsurancePackageSerializer, PackageProcessSerializer)

def is_admin(user):
    return user.role == "admin"

def is_admin_or_staff(user):
    return user.role in ("admin", "staff")

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def category_list(request):
    if request.method == 'GET':
        categories = InsuranceCategory.objects.all()
        search = request.query_params.get('search', None)
        if search:
            categories = categories.filter(name__icontains=search)
        serializer = InsuranceCategorySerializer(categories, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not is_admin(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = InsuranceCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def category_detail(request, id):
    try:
        category = InsuranceCategory.objects.get(id=id)
    except InsuranceCategory.DoesNotExist:
        return Response({'error': 'Không tìm thấy danh mục.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = InsuranceCategorySerializer(category)
        return Response(serializer.data)

    elif request.method == 'PUT':
        if not is_admin(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = InsuranceCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not is_admin(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        category.is_active = False
        category.save()
        return Response({'message': 'Đã vô hiệu hoá danh mục.'})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def package_list(request):
    if request.method == 'GET':
        packages = InsurancePackage.objects.select_related('category').all()

        category = request.query_params.get('category', None)
        status_ = request.query_params.get('status', None)
        search = request.query_params.get('search', None)

        if category:
            packages = packages.filter(category_id=category)
        if status_:
            packages = packages.filter(status=status_)
        if search:
            packages = packages.filter(name__icontains=search) | packages.filter(code__icontains=search)

        if request.user.role == 'customer':
            packages = packages.filter(status='active')

        serializer = InsurancePackageListSerializer(packages, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not is_admin(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = InsurancePackageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def package_detail(request, id):
    try:
        package = InsurancePackage.objects.select_related('category').prefetch_related('processes').get(id=id)
    except InsurancePackage.DoesNotExist:
        return Response({'error': 'Không tìm thấy gói bảo hiểm.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if request.user.role == 'customer' and package.status != 'active':
            return Response({'error': 'Không tìm thấy gói bảo hiểm.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = InsurancePackageSerializer(package)
        return Response(serializer.data)

    elif request.method == 'PUT':
        if not is_admin(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = InsurancePackageSerializer(package, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not is_admin(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        package.status = 'inactive'
        package.save()
        return Response({'message': 'Đã ngừng bán gói bảo hiểm.'})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def process_list(request, package_id):
    try:
        package = InsurancePackage.objects.get(id=package_id)
    except InsurancePackage.DoesNotExist:
        return Response({'error': 'Không tìm thấy gói bảo hiểm.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        process_type = request.query_params.get('process_type', None)
        processes = package.processes.all()
        if process_type:
            processes = processes.filter(process_type=process_type)
        serializer = PackageProcessSerializer(processes, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not is_admin(request.user):
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = PackageProcessSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(package=package)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def process_detail(request, package_id, process_id):
    if not is_admin(request.user):
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        process = PackageProcess.objects.get(id=process_id, package_id=package_id)
    except PackageProcess.DoesNotExist:
        return Response({'error': 'Không tìm thấy bước quy trình.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = PackageProcessSerializer(process, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        process.delete()
        return Response({'message': 'Đã xoá bước quy trình.'})