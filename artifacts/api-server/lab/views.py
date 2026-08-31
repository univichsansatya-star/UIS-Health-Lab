from uuid import uuid4

from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.status import HTTP_201_CREATED, HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND

from .authentication import current_user_name
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
from .permissions import IsAuthenticatedClerk
from .serializers import (
    ChecklistSerializer,
    DecisionSerializer,
    EquipmentCategorySerializer,
    EquipmentSerializer,
    GuideInputSerializer,
    GuideSerializer,
    LoanRequestInputSerializer,
    LoanRequestSerializer,
    NotificationSerializer,
    RoomBookingInputSerializer,
    RoomBookingSerializer,
    RoomSerializer,
    StockSerializer,
)


def validation_error(serializer) -> Response:
    return Response({"error": serializer.errors}, status=HTTP_400_BAD_REQUEST)


def uuid_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:12]}"


@api_view(["GET"])
@permission_classes([AllowAny])
def healthz(request):
    return Response({"status": "ok"})


@api_view(["GET"])
@permission_classes([IsAuthenticatedClerk])
def dashboard(request):
    role = request.query_params.get("role", "student")
    loans = list(LoanRequest.objects.order_by("-submitted_at"))
    bookings = list(RoomBooking.objects.order_by("-submitted_at"))
    unread = Notification.objects.filter(is_read=False).count()
    available = sum(Equipment.objects.values_list("available_units", flat=True))
    submitted_loans = sum(item.status == "submitted" for item in loans)
    submitted_bookings = sum(item.status == "submitted" for item in bookings)

    if role == "laboran":
        payload = {
            "role": "laboran",
            "greeting": "Selamat pagi, Laboran",
            "stats": [
                {"label": "Menunggu persetujuan", "value": str(submitted_loans + submitted_bookings), "detail": f"{submitted_loans} alat · {submitted_bookings} ruangan", "tone": "red"},
                {"label": "Alat tersedia", "value": str(available), "detail": "dari seluruh katalog", "tone": "blue"},
                {"label": "Ruangan aktif", "value": str(sum(item.status == "scheduled" for item in bookings) + 12), "detail": "jadwal minggu ini", "tone": "green"},
                {"label": "Belum dibaca", "value": str(unread), "detail": "notifikasi masuk", "tone": "amber"},
            ],
            "recentActivity": [
                *[
                    {"id": item.id, "title": "Pengajuan baru masuk" if item.status == "submitted" else "Status peminjaman berubah", "description": f"{item.student_name} · {item.equipment_name}", "time": "Hari ini", "type": "loan"}
                    for item in loans[:2]
                ],
                *[
                    {"id": item.id, "title": "Booking ruangan menunggu", "description": f"{item.student_name} · {item.room_name}", "time": "Kemarin", "type": "room"}
                    for item in bookings[:1]
                ],
            ],
        }
    else:
        payload = {
            "role": "student",
            "greeting": "Selamat pagi, Alya",
            "stats": [
                {"label": "Pengajuan aktif", "value": str(sum(item.status in {"submitted", "approved", "borrowed"} for item in loans)), "detail": "peminjaman alat", "tone": "blue"},
                {"label": "Booking terjadwal", "value": str(sum(item.status in {"approved", "scheduled"} for item in bookings)), "detail": "ruangan lab", "tone": "green"},
                {"label": "Alat tersedia", "value": str(available), "detail": "siap dipinjam", "tone": "amber"},
                {"label": "Notifikasi baru", "value": str(unread), "detail": "perlu kamu lihat", "tone": "red"},
            ],
            "recentActivity": [
                {"id": "activity-1", "title": "Peminjaman disetujui", "description": "Stetoskop Littmann Classic III", "time": "2 jam lalu", "type": "loan"},
                {"id": "activity-2", "title": "Booking terjadwal", "description": "Lab KMB · 4 Sep, 09:00", "time": "Kemarin", "type": "room"},
                {"id": "activity-3", "title": "Daftar tilik diperbarui", "description": "6 item baru tersedia di katalog", "time": "3 hari lalu", "type": "system"},
            ],
        }
    payload.update({"labStatus": "operational", "labStatusDetail": "12 dari 15 ruangan siap digunakan"})
    return Response(payload)


@api_view(["GET"])
@permission_classes([AllowAny])
def categories(request):
    return Response(EquipmentCategorySerializer(EquipmentCategory.objects.all(), many=True).data)


def equipment_queryset(request):
    queryset = Equipment.objects.all()
    category = request.query_params.get("category")
    search = request.query_params.get("search")
    availability = request.query_params.get("availability")
    if category:
        queryset = queryset.filter(category_id=category)
    if search:
        queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
    if availability == "maintenance":
        queryset = queryset.filter(condition="maintenance")
    elif availability == "available":
        queryset = queryset.filter(condition__in=("good", "maintenance"), available_units__gt=0)
    return queryset


@api_view(["GET"])
@permission_classes([AllowAny])
def equipment(request):
    category_names = dict(EquipmentCategory.objects.values_list("id", "name"))
    items = list(equipment_queryset(request))
    for item in items:
        item._category_name = category_names.get(item.category_id, item.category_id)
    return Response(EquipmentSerializer(items, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def equipment_detail(request, equipment_id):
    try:
        item = Equipment.objects.get(id=equipment_id)
    except Equipment.DoesNotExist:
        return Response({"error": "Equipment not found"}, status=HTTP_404_NOT_FOUND)
    item._category_name = EquipmentCategory.objects.filter(id=item.category_id).values_list("name", flat=True).first() or item.category_id
    return Response(EquipmentSerializer(item).data)


@api_view(["GET"])
@permission_classes([IsAuthenticatedClerk])
def loan_requests(request):
    queryset = LoanRequest.objects.order_by("-submitted_at")
    status = request.query_params.get("status")
    if status and status != "all":
        queryset = queryset.filter(status=status)
    return Response(LoanRequestSerializer(queryset, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticatedClerk])
def create_loan_request(request):
    serializer = LoanRequestInputSerializer(data=request.data)
    if not serializer.is_valid():
        return validation_error(serializer)
    values = serializer.validated_data
    equipment_item = Equipment.objects.filter(id=values["equipmentId"]).first()
    if not equipment_item:
        return Response({"error": "Equipment not found"}, status=HTTP_404_NOT_FOUND)
    student_name, student_id = current_user_name(request)
    row = LoanRequest.objects.create(
        id=uuid_id("loan"),
        equipment_id=equipment_item.id,
        equipment_name=equipment_item.name,
        student_name=student_name,
        student_id=student_id,
        quantity=values["quantity"],
        purpose=values["purpose"],
        borrow_date=values["borrowDate"],
        return_date=values["returnDate"],
        status="submitted",
        submitted_at=timezone.now(),
    )
    return Response(LoanRequestSerializer(row).data, status=HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticatedClerk])
def decide_loan_request(request, request_id):
    body = DecisionSerializer(data=request.data)
    if not body.is_valid():
        return validation_error(body)
    try:
        row = LoanRequest.objects.get(id=request_id)
    except LoanRequest.DoesNotExist:
        return Response({"error": "Loan request not found"}, status=HTTP_404_NOT_FOUND)
    row.status = body.validated_data["decision"]
    row.decision_note = body.validated_data.get("note")
    row.save(update_fields=["status", "decision_note"])
    return Response(LoanRequestSerializer(row).data)


def update_loan_status(request_id, status):
    try:
        row = LoanRequest.objects.get(id=request_id)
    except LoanRequest.DoesNotExist:
        return Response({"error": "Loan request not found"}, status=HTTP_404_NOT_FOUND)
    row.status = status
    row.save(update_fields=["status"])
    return Response(LoanRequestSerializer(row).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticatedClerk])
def handover_loan_request(request, request_id):
    return update_loan_status(request_id, "borrowed")


@api_view(["PATCH"])
@permission_classes([IsAuthenticatedClerk])
def return_loan_request(request, request_id):
    return update_loan_status(request_id, "returned")


@api_view(["GET"])
@permission_classes([AllowAny])
def rooms(request):
    return Response(RoomSerializer(LabRoom.objects.all(), many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticatedClerk])
def room_bookings(request):
    queryset = RoomBooking.objects.order_by("-submitted_at")
    status = request.query_params.get("status")
    if status and status != "all":
        queryset = queryset.filter(status=status)
    return Response(RoomBookingSerializer(queryset, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticatedClerk])
def create_room_booking(request):
    serializer = RoomBookingInputSerializer(data=request.data)
    if not serializer.is_valid():
        return validation_error(serializer)
    values = serializer.validated_data
    room = LabRoom.objects.filter(id=values["roomId"]).first()
    if not room:
        return Response({"error": "Room not found"}, status=HTTP_404_NOT_FOUND)
    student_name, student_id = current_user_name(request)
    row = RoomBooking.objects.create(
        id=uuid_id("booking"),
        room_id=room.id,
        room_name=room.name,
        student_name=student_name,
        student_id=student_id,
        purpose=values["purpose"],
        date=values["date"],
        start_time=values["startTime"].strftime("%H:%M"),
        end_time=values["endTime"].strftime("%H:%M"),
        attendees=values["attendees"],
        status="submitted",
        submitted_at=timezone.now(),
    )
    return Response(RoomBookingSerializer(row).data, status=HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticatedClerk])
def decide_room_booking(request, booking_id):
    body = DecisionSerializer(data=request.data)
    if not body.is_valid():
        return validation_error(body)
    try:
        row = RoomBooking.objects.get(id=booking_id)
    except RoomBooking.DoesNotExist:
        return Response({"error": "Room booking not found"}, status=HTTP_404_NOT_FOUND)
    row.status = "scheduled" if body.validated_data["decision"] == "approved" else "rejected"
    row.decision_note = body.validated_data.get("note")
    row.save(update_fields=["status", "decision_note"])
    return Response(RoomBookingSerializer(row).data)


@api_view(["GET"])
@permission_classes([IsAuthenticatedClerk])
def stock(request):
    queryset = StockItem.objects.all()
    stock_type = request.query_params.get("type")
    search = request.query_params.get("search")
    if stock_type:
        queryset = queryset.filter(type=stock_type)
    if search:
        queryset = queryset.filter(name__icontains=search)
    return Response(StockSerializer(queryset, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticatedClerk])
def checklist(request):
    queryset = ChecklistItem.objects.all()
    search = request.query_params.get("search")
    if search:
        queryset = queryset.filter(name__icontains=search)
    return Response(ChecklistSerializer(queryset, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticatedClerk])
def notifications(request):
    return Response(NotificationSerializer(Notification.objects.order_by("-created_at"), many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticatedClerk])
def mark_notification_read(request, notification_id):
    try:
        row = Notification.objects.get(id=notification_id)
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found"}, status=HTTP_404_NOT_FOUND)
    row.is_read = True
    row.save(update_fields=["is_read"])
    return Response(NotificationSerializer(row).data)


@api_view(["GET"])
@permission_classes([IsAuthenticatedClerk])
def guide(request):
    row = Guide.objects.filter(id="main").first()
    if not row:
        return Response({"error": "Guide not found"}, status=HTTP_404_NOT_FOUND)
    return Response(GuideSerializer(row).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticatedClerk])
def update_guide(request):
    body = GuideInputSerializer(data=request.data)
    if not body.is_valid():
        return validation_error(body)
    row = Guide.objects.filter(id="main").first()
    if not row:
        return Response({"error": "Guide not found"}, status=HTTP_404_NOT_FOUND)
    values = body.validated_data
    row.title = values["title"]
    row.intro = values["intro"]
    row.steps = values["steps"]
    row.updated_at = timezone.now()
    row.save(update_fields=["title", "intro", "steps", "updated_at"])
    return Response(GuideSerializer(row).data)