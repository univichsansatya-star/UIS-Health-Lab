from django.urls import path

from . import views

urlpatterns = [
    path("healthz", views.healthz),
    path("dashboard", views.dashboard),
    path("categories", views.categories),
    path("equipment", views.equipment),
    path("equipment/<str:equipment_id>", views.equipment_detail),
    path("loan-requests", views.loan_requests),
    path("loan-requests/<str:request_id>/decision", views.decide_loan_request),
    path("loan-requests/<str:request_id>/handover", views.handover_loan_request),
    path("loan-requests/<str:request_id>/return", views.return_loan_request),
    path("room-bookings", views.room_bookings),
    path("room-bookings/<str:booking_id>/decision", views.decide_room_booking),
    path("rooms", views.rooms),
    path("stock", views.stock),
    path("checklist", views.checklist),
    path("notifications", views.notifications),
    path("notifications/<str:notification_id>/read", views.mark_notification_read),
    path("guide", views.guide),
]