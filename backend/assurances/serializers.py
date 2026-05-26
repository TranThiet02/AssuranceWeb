from rest_framework import serializers
from .models import InsuranceCategory, InsurancePackage, PackageProcess

class InsuranceCategorySerializer(serializers.ModelSerializer):
    package_count = serializers.SerializerMethodField()

    class Meta:
        model = InsuranceCategory
        fields = ["id", "name", "description", "is_active", "created_at", "package_count"]
        read_only_fields = ["id", "created_at"]

    def get_package_count(self, obj):
        return obj.packages.filter(status="active").count()


class PackageProcessSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageProcess
        fields = ["id", "process_type", "step_order", "title", "description", "duration_days", "is_required"]
        read_only_fields = ["id"]


class InsurancePackageSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    processes = PackageProcessSerializer(many=True, read_only=True)

    class Meta:
        model = InsurancePackage
        fields = [
            "id", "category", "category_name", "name", "code",
            "description", "coverage_detail", "price", "payment_cycle",
            "coverage_amount", "duration_months", "min_age", "max_age",
            "status", "created_at", "updated_at", "processes",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class InsurancePackageListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = InsurancePackage
        fields = [
            "id", "category", "category_name", "name", "code",
            "price", "payment_cycle", "coverage_amount",
            "duration_months", "status", "created_at",
        ]
        read_only_fields = ["id", "created_at"]