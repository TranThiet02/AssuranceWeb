import secrets
from datetime import timedelta

from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import AccessLog, PasswordResetToken, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "avatar", "role", "is_active", "date_joined"]
        read_only_fields = ["id", "date_joined"]

class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "full_name", "phone", "role", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "phone", "avatar", "is_active"]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        request = self.context["request"]
        email = attrs["email"]
        user = authenticate(request, username=email, password=attrs["password"])
        if not user:
            AccessLog.objects.create(
                email=email,
                action=AccessLog.Action.LOGIN_FAILED,
            )
            raise serializers.ValidationError("Email hoặc mật khẩu không đúng.")

        if not user.is_active:
            raise serializers.ValidationError("Tài khoản đã bị vô hiệu hoá.")

        AccessLog.objects.create(
            user=user,
            email=email,
            action=AccessLog.Action.LOGIN,
        )

        refresh = RefreshToken.for_user(user)
        attrs["user"] = user
        attrs["access_token"] = str(refresh.access_token)
        attrs["refresh_token"] = str(refresh)
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Mật khẩu xác nhận không khớp.")
        if not self.context["request"].user.check_password(attrs["old_password"]):
            raise serializers.ValidationError("Mật khẩu cũ không đúng.")
        return attrs

class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def save(self):
        email = self.validated_data["email"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None 

        token_value = secrets.token_urlsafe(48)
        PasswordResetToken.objects.create(
            user=user,
            token=token_value,
            expires_at=timezone.now() + timedelta(hours=2),
        )
        return token_value

class ConfirmPasswordResetSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Mật khẩu xác nhận không khớp.")
        try:
            reset_token = PasswordResetToken.objects.select_related("user").get(token=attrs["token"])
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Token không hợp lệ.")
        if not reset_token.is_valid():
            raise serializers.ValidationError("Token đã hết hạn hoặc đã được dùng.")
        attrs["reset_token"] = reset_token
        return attrs

    def save(self):
        reset_token = self.validated_data["reset_token"]
        user = reset_token.user
        user.set_password(self.validated_data["new_password"])
        user.save()
        reset_token.is_used = True
        reset_token.save()
        AccessLog.objects.create(
            user=user,
            email=user.email,
            action=AccessLog.Action.PASSWORD_RESET,
        )


class AccessLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AccessLog
        fields = ["id", "email", "action", "timestamp", "note"]