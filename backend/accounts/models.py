import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        STAFF = "staff", "Staff"
        CUSTOMER = "customer", "Customer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CUSTOMER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    class Meta:
        db_table = "users"
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.full_name} <{self.email}> [{self.role}]"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_staff_role(self):
        return self.role == self.Role.STAFF

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER


class AccessLog(models.Model):
    class Action(models.TextChoices):
        LOGIN = "login", "Login"
        LOGOUT = "logout", "Logout"
        LOGIN_FAILED = "login_failed", "Login Failed"
        PASSWORD_RESET = "password_reset", "Password Reset"
        TOKEN_REFRESH  = "token_refresh",  "Token Refresh"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="access_logs", null=True, blank=True)
    email = models.EmailField()
    action = models.CharField(max_length=20, choices=Action.choices)
    note = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "access_logs"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"[{self.action}] {self.email} at {self.timestamp:%Y-%m-%d %H:%M:%S}"


class PasswordResetToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_tokens")
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "password_reset_tokens"

    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()