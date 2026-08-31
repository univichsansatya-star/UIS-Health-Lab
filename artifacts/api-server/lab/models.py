from django.contrib.postgres.fields import ArrayField
from django.db import models


class EquipmentCategory(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255, db_column="short_name")
    description = models.TextField()
    available_count = models.IntegerField(default=0, db_column="available_count")
    total_count = models.IntegerField(default=0, db_column="total_count")

    class Meta:
        managed = False
        db_table = "equipment_categories"


class Equipment(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    category_id = models.CharField(max_length=100, db_column="category_id")
    description = models.TextField()
    location = models.CharField(max_length=255)
    available_units = models.IntegerField(default=0, db_column="available_units")
    total_units = models.IntegerField(default=0, db_column="total_units")
    condition = models.CharField(max_length=50, default="good")
    image = models.CharField(max_length=255)
    is_popular = models.BooleanField(default=False, db_column="is_popular")

    class Meta:
        managed = False
        db_table = "equipment"


class LabRoom(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    building = models.CharField(max_length=50)
    floor = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default="available")
    capacity = models.IntegerField()
    description = models.TextField()

    class Meta:
        managed = False
        db_table = "lab_rooms"


class LoanRequest(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    equipment_id = models.CharField(max_length=100, db_column="equipment_id")
    equipment_name = models.CharField(max_length=255, db_column="equipment_name")
    student_name = models.CharField(max_length=255, db_column="student_name")
    student_id = models.CharField(max_length=100, db_column="student_id")
    quantity = models.IntegerField()
    purpose = models.TextField()
    borrow_date = models.DateField(db_column="borrow_date")
    return_date = models.DateField(db_column="return_date")
    status = models.CharField(max_length=50, default="submitted")
    submitted_at = models.DateTimeField(auto_now_add=False, db_column="submitted_at")
    decision_note = models.TextField(null=True, blank=True, db_column="decision_note")

    class Meta:
        managed = False
        db_table = "loan_requests"


class RoomBooking(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    room_id = models.CharField(max_length=100, db_column="room_id")
    room_name = models.CharField(max_length=255, db_column="room_name")
    student_name = models.CharField(max_length=255, db_column="student_name")
    student_id = models.CharField(max_length=100, db_column="student_id")
    purpose = models.TextField()
    date = models.DateField()
    start_time = models.CharField(max_length=20, db_column="start_time")
    end_time = models.CharField(max_length=20, db_column="end_time")
    attendees = models.IntegerField()
    status = models.CharField(max_length=50, default="submitted")
    submitted_at = models.DateTimeField(auto_now_add=False, db_column="submitted_at")
    decision_note = models.TextField(null=True, blank=True, db_column="decision_note")

    class Meta:
        managed = False
        db_table = "room_bookings"


class StockItem(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50)
    category = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit = models.CharField(max_length=50)
    condition = models.CharField(max_length=50)
    last_updated = models.DateField(db_column="last_updated")

    class Meta:
        managed = False
        db_table = "stock_items"


class ChecklistItem(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    quantity = models.IntegerField()
    location = models.CharField(max_length=255)
    condition = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = "checklist_items"


class Notification(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=False, db_column="created_at")
    is_read = models.BooleanField(default=False, db_column="is_read")

    class Meta:
        managed = False
        db_table = "notifications"


class Guide(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=255)
    intro = models.TextField()
    steps = ArrayField(models.TextField())
    updated_at = models.DateTimeField(auto_now_add=False, db_column="updated_at")

    class Meta:
        managed = False
        db_table = "guides"