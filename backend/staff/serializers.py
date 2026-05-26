from rest_framework import serializers
from .models import StaffAssignment, StaffSchedule

class StaffAssignmentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.full_name", read_only=True)
    staff_email = serializers.CharField(source="staff.email", read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    customer_phone = serializers.CharField(source="customer.phone", read_only=True)
    assigned_by_name = serializers.CharField(source="assigned_by.full_name", read_only=True, allow_null=True)

    class Meta:
        model = StaffAssignment
        fields = [
            "id", "staff", "staff_name", "staff_email",
            "customer", "customer_name", "customer_email", "customer_phone",
            "note", "is_active", "assigned_at", "assigned_by_name",
        ]
        read_only_fields = ["id", "assigned_at", "assigned_by_name"]


class StaffScheduleSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.full_name", read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)

    class Meta:
        model = StaffSchedule
        fields = [
            "id", "staff", "staff_name",
            "customer", "customer_name", "customer_email",
            "title", "description", "scheduled_at",
            "status", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class StaffSummarySerializer(serializers.Serializer):
    total_customers = serializers.IntegerField()
    active_contracts = serializers.IntegerField()
    pending_schedules = serializers.IntegerField()
    pending_incidents = serializers.IntegerField()