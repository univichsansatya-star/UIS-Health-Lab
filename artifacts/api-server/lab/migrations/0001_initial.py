import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="ChecklistItem",
            fields=[
                ("id", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("category", models.CharField(max_length=255)),
                ("quantity", models.IntegerField()),
                ("location", models.CharField(max_length=255)),
                ("condition", models.CharField(max_length=50)),
            ],
            options={"db_table": "checklist_items", "managed": False},
        ),
        migrations.CreateModel(
            name="Equipment",
            fields=[
                ("id", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("category_id", models.CharField(db_column="category_id", max_length=100)),
                ("description", models.TextField()),
                ("location", models.CharField(max_length=255)),
                ("available_units", models.IntegerField(db_column="available_units", default=0)),
                ("total_units", models.IntegerField(db_column="total_units", default=0)),
                ("condition", models.CharField(default="good", max_length=50)),
                ("image", models.CharField(max_length=255)),
                ("is_popular", models.BooleanField(db_column="is_popular", default=False)),
            ],
            options={"db_table": "equipment", "managed": False},
        ),
        migrations.CreateModel(
            name="EquipmentCategory",
            fields=[
                ("id", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("short_name", models.CharField(db_column="short_name", max_length=255)),
                ("description", models.TextField()),
                ("available_count", models.IntegerField(db_column="available_count", default=0)),
                ("total_count", models.IntegerField(db_column="total_count", default=0)),
            ],
            options={"db_table": "equipment_categories", "managed": False},
        ),
        migrations.CreateModel(
            name="Guide",
            fields=[
                ("id", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=255)),
                ("intro", models.TextField()),
                ("steps", django.contrib.postgres.fields.ArrayField(base_field=models.TextField())),
                ("updated_at", models.DateTimeField(db_column="updated_at")),
            ],
            options={"db_table": "guides", "managed": False},
        ),
        migrations.CreateModel(
            name="LabRoom",
            fields=[
                ("id", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("building", models.CharField(max_length=50)),
                ("floor", models.CharField(max_length=100)),
                ("name", models.CharField(max_length=255)),
                ("status", models.CharField(default="available", max_length=50)),
                ("capacity", models.IntegerField()),
                ("description", models.TextField()),
            ],
            options={"db_table": "lab_rooms", "managed": False},
        ),
        migrations.CreateModel(
            name="LoanRequest",
            fields=[
                ("id", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("equipment_id", models.CharField(db_column="equipment_id", max_length=100)),
                ("equipment_name", models.CharField(db_column="equipment_name", max_length=255)),
                ("student_name", models.CharField(db_column="student_name", max_length=255)),
                ("student_id", models.CharField(db_column="student_id", max_length=100)),
                ("quantity", models.IntegerField()),
                ("purpose", models.TextField()),
                ("borrow_date", models.DateField(db_column="borrow_date")),
                ("return_date", models.DateField(db_column="return_date")),
                ("status", models.CharField(default="submitted", max_length=50)),
                ("submitted_at", models.DateTimeField(db_column="submitted_at")),
                ("decision_note", models.TextField(blank=True, db_column="decision_note", null=True)),
            ],
            options={"db_table": "loan_requests", "managed": False},
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=255)),
                ("message", models.TextField()),
                ("type", models.CharField(max_length=50)),
                ("created_at", models.DateTimeField(db_column="created_at")),
                ("is_read", models.BooleanField(db_column="is_read", default=False)),
            ],
            options={"db_table": "notifications", "managed": False},
        ),
        migrations.CreateModel(
            name="RoomBooking",
            fields=[
                ("id", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("room_id", models.CharField(db_column="room_id", max_length=100)),
                ("room_name", models.CharField(db_column="room_name", max_length=255)),
                ("student_name", models.CharField(db_column="student_name", max_length=255)),
                ("student_id", models.CharField(db_column="student_id", max_length=100)),
                ("purpose", models.TextField()),
                ("date", models.DateField()),
                ("start_time", models.CharField(db_column="start_time", max_length=20)),
                ("end_time", models.CharField(db_column="end_time", max_length=20)),
                ("attendees", models.IntegerField()),
                ("status", models.CharField(default="submitted", max_length=50)),
                ("submitted_at", models.DateTimeField(db_column="submitted_at")),
                ("decision_note", models.TextField(blank=True, db_column="decision_note", null=True)),
            ],
            options={"db_table": "room_bookings", "managed": False},
        ),
        migrations.CreateModel(
            name="StockItem",
            fields=[
                ("id", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("type", models.CharField(max_length=50)),
                ("category", models.CharField(max_length=255)),
                ("quantity", models.IntegerField()),
                ("unit", models.CharField(max_length=50)),
                ("condition", models.CharField(max_length=50)),
                ("last_updated", models.DateField(db_column="last_updated")),
            ],
            options={"db_table": "stock_items", "managed": False},
        ),
    ]