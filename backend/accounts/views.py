import secrets

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import AccessLog, User
from .serializers import (
    AccessLogSerializer,
    ChangePasswordSerializer,
    ConfirmPasswordResetSerializer,
    CreateUserSerializer,
    LoginSerializer,
    RequestPasswordResetSerializer,
    UpdateUserSerializer,
    UserSerializer,
)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        data = serializer.validated_data
        return Response({
            'access':  data['access_token'],
            'refresh': data['refresh_token'],
            'user':    UserSerializer(data['user']).data,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
    except Exception:
        pass

    AccessLog.objects.create(
        user=request.user,
        email=request.user.email,
        action=AccessLog.Action.LOGOUT,
    )
    return Response({'message': 'Đăng xuất thành công.'})

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = UpdateUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Đổi mật khẩu thành công.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    serializer = RequestPasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
    return Response({'message': 'Nếu email tồn tại, link reset đã được gửi.'})

@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    serializer = ConfirmPasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Đặt lại mật khẩu thành công.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_list(request):
    if request.method == 'GET':
        users = User.objects.all()
        role = request.query_params.get('role', None)
        search = request.query_params.get('search', None)
        if role:
            users = users.filter(role=role)
        if search:
            users = users.filter(full_name__icontains=search) | users.filter(email__icontains=search)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not request.user.is_admin:
            return Response({'error': 'Không có quyền thực hiện.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CreateUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_detail(request, id):
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return Response({'error': 'Không tìm thấy user.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if not request.user.is_admin and not request.user.is_staff_role and request.user.id != user.id:
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        if not request.user.is_admin and request.user.id != user.id:
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = UpdateUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not request.user.is_admin:
            return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        user.is_active = False
        user.save()
        return Response({'message': 'Tài khoản đã bị vô hiệu hoá.'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_reset_password(request, id):
    if not request.user.is_admin:
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return Response({'error': 'Không tìm thấy user.'}, status=status.HTTP_404_NOT_FOUND)

    temp_password = secrets.token_urlsafe(10)
    user.set_password(temp_password)
    user.save()
    AccessLog.objects.create(
        user=user,
        email=user.email,
        action=AccessLog.Action.PASSWORD_RESET,
        note=f'Reset by admin {request.user.email}',
    )
    return Response({'message': 'Đã reset mật khẩu.', 'temp_password': temp_password})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_logs(request, id):
    if not request.user.is_admin and not request.user.is_staff_role:
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return Response({'error': 'Không tìm thấy user.'}, status=status.HTTP_404_NOT_FOUND)

    logs = AccessLog.objects.filter(user=user).order_by('-timestamp')[:100]
    serializer = AccessLogSerializer(logs, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def access_log_list(request):
    if not request.user.is_admin:
        return Response({'error': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)

    logs = AccessLog.objects.all()
    user_id = request.query_params.get('user_id', None)
    action = request.query_params.get('action', None)
    date = request.query_params.get('date', None)
    if user_id:
        logs = logs.filter(user_id=user_id)
    if action:
        logs = logs.filter(action=action)
    if date:
        logs = logs.filter(timestamp__date=date)

    logs = logs.order_by('-timestamp')[:500]
    serializer = AccessLogSerializer(logs, many=True)
    return Response(serializer.data)