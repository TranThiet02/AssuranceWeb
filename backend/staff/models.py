import uuid
from django.db import models
from django.conf import settings

class StaffAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assignments")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assigned_staff")
    note = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_assignments")

    class Meta:
        db_table = "staff_assignments"
        unique_together = [["staff", "customer"]]
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.staff.full_name} → {self.customer.full_name}"


class StaffSchedule(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Chờ xác nhận"
        CONFIRMED = "confirmed", "Đã xác nhận"
        DONE = "done", "Hoàn thành"
        CANCELLED = "cancelled", "Đã huỷ"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="schedules")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_schedules")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "staff_schedules"
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.title} — {self.staff.full_name} & {self.customer.full_name}"