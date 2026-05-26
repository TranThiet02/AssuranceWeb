from rest_framework import serializers
from .models import Contract, ContractDocument, CustomerProfile

class CustomerProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_phone = serializers.CharField(source="user.phone", read_only=True)
    user_is_active = serializers.BooleanField(source="user.is_active", read_only=True)

    class Meta:
        model  = CustomerProfile
        fields = [
            "id", "user", "user_email", "user_name", "user_phone", "user_is_active",
            "date_of_birth", "gender", "address", "city",
            "id_number", "occupation", "note", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ContractDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.full_name", read_only=True)

    class Meta:
        model  = ContractDocument
        fields = ["id", "name", "file", "uploaded_by_name", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at", "uploaded_by_name"]


class ContractSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    package_name = serializers.CharField(source="package.name", read_only=True)
    package_code = serializers.CharField(source="package.code", read_only=True)
    staff_name = serializers.CharField(source="staff.full_name", read_only=True, allow_null=True)
    documents = ContractDocumentSerializer(many=True, read_only=True)

    class Meta:
        model  = Contract
        fields = [
            "id", "contract_number",
            "customer", "customer_name", "customer_email",
            "package", "package_name", "package_code",
            "staff", "staff_name",
            "status", "start_date", "end_date",
            "premium_amount", "note",
            "created_at", "updated_at", "documents",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ContractListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    package_name = serializers.CharField(source="package.name", read_only=True)
    package_code = serializers.CharField(source="package.code", read_only=True)
    staff_name = serializers.CharField(source="staff.full_name", read_only=True, allow_null=True)

    class Meta:
        model  = Contract
        fields = [
            "id", "contract_number",
            "customer", "customer_name", "customer_email",
            "package", "package_name", "package_code",
            "staff", "staff_name",
            "status", "start_date", "end_date",
            "premium_amount", "created_at",
        ]
        read_only_fields = ["id", "created_at"]