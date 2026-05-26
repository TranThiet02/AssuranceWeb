import uuid
from django.db import models
from django.conf import settings

class CustomerProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = "male", "Nam"
        FEMALE = "female", "Nữ"
        OTHER = "other", "Khác"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_profile")
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    id_number = models.CharField(max_length=20, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customer_profiles"

    def __str__(self):
        return f"Profile of {self.user.full_name}"

class Contract(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Chờ duyệt"
        ACTIVE = "active", "Đang hiệu lực"
        EXPIRED = "expired", "Hết hạn"
        CANCELLED = "cancelled", "Đã huỷ"
        REJECTED  = "rejected", "Từ chối"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="contracts")
    package = models.ForeignKey("assurances.InsurancePackage", on_delete=models.PROTECT, related_name="contracts")
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="managed_contracts")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    premium_amount = models.DecimalField(max_digits=14, decimal_places=0)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "contracts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.contract_number} — {self.customer.full_name}"


class ContractDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name="documents")
    name = models.CharField(max_length=200)
    file = models.FileField(upload_to="contracts/documents/")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "contract_documents"

    def __str__(self):
        return f"{self.contract.contract_number} / {self.name}"