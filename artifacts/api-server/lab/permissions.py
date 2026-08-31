from rest_framework.permissions import BasePermission


class IsAuthenticatedClerk(BasePermission):
    message = "A signed-in Clerk session is required."

    def has_permission(self, request, view):
        return bool(getattr(request.user, "is_authenticated", False))