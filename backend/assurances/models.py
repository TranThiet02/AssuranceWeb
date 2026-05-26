import uuid
from django.db import models

class InsuranceCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "insurance_categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class InsurancePackage(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Đang bán"
        INACTIVE = "inactive", "Ngừng bán"
        DRAFT = "draft", "Nháp"

    class PaymentCycle(models.TextChoices):
        MONTHLY = "monthly", "Hàng tháng"
        QUARTERLY = "quarterly", "Hàng quý"
        YEARLY = "yearly", "Hàng năm"
        ONE_TIME = "one_time", "Một lần"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(InsuranceCategory, on_delete=models.PROTECT, related_name="packages")
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    coverage_detail = models.TextField(blank=True)
    price = models.DecimalField(max_digits=14, decimal_places=0)
    payment_cycle = models.CharField(max_length=10, choices=PaymentCycle.choices, default=PaymentCycle.YEARLY)
    coverage_amount = models.DecimalField(max_digits=14, decimal_places=0)
    duration_months = models.PositiveIntegerField(default=12)
    min_age = models.PositiveIntegerField(default=18)
    max_age = models.PositiveIntegerField(default=65)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "insurance_packages"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.code}] {self.name}"


class PackageProcess(models.Model):
    class ProcessType(models.TextChoices):
        REGISTRATION = "registration", "Đăng ký"
        CLAIM = "claim", "Bồi thường"
        RENEWAL = "renewal", "Gia hạn"
        CANCELLATION = "cancellation", "Huỷ hợp đồng"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    package = models.ForeignKey(InsurancePackage, on_delete=models.CASCADE, related_name="processes")
    process_type = models.CharField(max_length=15, choices=ProcessType.choices)
    step_order = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration_days = models.PositiveIntegerField(default=1) 
    is_required  = models.BooleanField(default=True)

    class Meta:
        db_table = "package_processes"
        ordering = ["package", "process_type", "step_order"]
        unique_together = [["package", "process_type", "step_order"]]

    def __str__(self):
        return f"{self.package.code} | {self.process_type} | Step {self.step_order}: {self.title}"