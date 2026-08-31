from rest_framework import serializers

from .models import (
    ChecklistItem,
    Equipment,
    EquipmentCategory,
    Guide,
    LabRoom,
    LoanRequest,
    Notification,
    RoomBooking,
    StockItem,
)


class EquipmentCategorySerializer(serializers.ModelSerializer):
    shortName = serializers.CharField(source="short_name")
    availableCount = serializers.IntegerField(source="available_count")
    totalCount = serializers.IntegerField(source="total_count")

    class Meta:
        model = EquipmentCategory
        fields = ("id", "name", "shortName", "description", "availableCount", "totalCount")


class EquipmentSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    categoryId = serializers.CharField(source="category_id")
    availableUnits = serializers.IntegerField(source="available_units")
    totalUnits = serializers.IntegerField(source="total_units")
    isPopular = serializers.BooleanField(source="is_popular")

    def get_category(self, obj):
        return getattr(obj, "_category_name", obj.category_id)

    class Meta:
        model = Equipment
        fields = (
            "id", "name", "category", "categoryId", "description", "location",
            "availableUnits", "totalUnits", "condition", "image", "isPopular",
        )


class LoanRequestSerializer(serializers.ModelSerializer):
    equipmentId = serializers.CharField(source="equipment_id")
    equipmentName = serializers.CharField(source="equipment_name")
    studentName = serializers.CharField(source="student_name")
    studentId = serializers.CharField(source="student_id")
    borrowDate = serializers.DateField(source="borrow_date")
    returnDate = serializers.DateField(source="return_date")
    submittedAt = serializers.DateTimeField(source="submitted_at")
    decisionNote = serializers.CharField(source="decision_note", allow_null=True)

    class Meta:
        model = LoanRequest
        fields = (
            "id", "equipmentId", "equipmentName", "studentName", "studentId",
            "quantity", "purpose", "borrowDate", "returnDate", "status",
            "submittedAt", "decisionNote",
        )


class LoanRequestInputSerializer(serializers.Serializer):
    equipmentId = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1)
    purpose = serializers.CharField()
    borrowDate = serializers.DateField()
    returnDate = serializers.DateField()


class DecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=("approved", "rejected"))
    note = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabRoom
        fields = ("id", "building", "floor", "name", "status", "capacity", "description")


class RoomBookingSerializer(serializers.ModelSerializer):
    roomId = serializers.CharField(source="room_id")
    roomName = serializers.CharField(source="room_name")
    studentName = serializers.CharField(source="student_name")
    studentId = serializers.CharField(source="student_id")
    startTime = serializers.CharField(source="start_time")
    endTime = serializers.CharField(source="end_time")
    submittedAt = serializers.DateTimeField(source="submitted_at")
    decisionNote = serializers.CharField(source="decision_note", allow_null=True)

    class Meta:
        model = RoomBooking
        fields = (
            "id", "roomId", "roomName", "studentName", "studentId", "purpose",
            "date", "startTime", "endTime", "attendees", "status",
            "submittedAt", "decisionNote",
        )


class RoomBookingInputSerializer(serializers.Serializer):
    roomId = serializers.CharField()
    purpose = serializers.CharField()
    date = serializers.DateField()
    startTime = serializers.TimeField(format="%H:%M", input_formats=("%H:%M", "%H:%M:%S"))
    endTime = serializers.TimeField(format="%H:%M", input_formats=("%H:%M", "%H:%M:%S"))
    attendees = serializers.IntegerField(min_value=1)


class StockSerializer(serializers.ModelSerializer):
    lastUpdated = serializers.DateField(source="last_updated")

    class Meta:
        model = StockItem
        fields = ("id", "name", "type", "category", "quantity", "unit", "condition", "lastUpdated")


class ChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ("id", "name", "category", "quantity", "location", "condition")


class NotificationSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")
    isRead = serializers.BooleanField(source="is_read")

    class Meta:
        model = Notification
        fields = ("id", "title", "message", "type", "createdAt", "isRead")


class GuideSerializer(serializers.ModelSerializer):
    updatedAt = serializers.DateTimeField(source="updated_at")

    class Meta:
        model = Guide
        fields = ("id", "title", "intro", "steps", "updatedAt")


class GuideInputSerializer(serializers.Serializer):
    title = serializers.CharField()
    intro = serializers.CharField()
    steps = serializers.ListField(child=serializers.CharField(), allow_empty=False)