import os
from functools import lru_cache
from typing import Any

import jwt
from jwt import PyJWKClient
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed


class ClerkUser:
    is_authenticated = True

    def __init__(self, claims: dict[str, Any]):
        self.claims = claims
        self.id = claims.get("sub", "")
        self.username = self.id
        self.email = claims.get("email", "")

    def __str__(self) -> str:
        return self.id

    def get_username(self) -> str:
        return self.username


@lru_cache(maxsize=8)
def jwks_client(url: str) -> PyJWKClient:
    return PyJWKClient(url)


def issuer_from_token(token: str) -> str:
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
    except jwt.DecodeError as exc:
        raise AuthenticationFailed("Invalid Clerk token.") from exc
    issuer = claims.get("iss")
    if not issuer:
        raise AuthenticationFailed("Clerk token has no issuer.")
    configured = os.getenv("CLERK_JWT_ISSUER")
    if configured and issuer.rstrip("/") != configured.rstrip("/"):
        raise AuthenticationFailed("Clerk token issuer is not allowed.")
    return issuer.rstrip("/")


class ClerkAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header:
            return None
        if header[0].lower() != b"bearer" or len(header) != 2:
            raise AuthenticationFailed("Use a Bearer Clerk session token.")
        token = header[1].decode("utf-8")
        issuer = issuer_from_token(token)
        jwks_url = os.getenv("CLERK_JWKS_URL", f"{issuer}/.well-known/jwks.json")
        try:
            key = jwks_client(jwks_url).get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                key.key,
                algorithms=["RS256"],
                issuer=issuer,
                options={"verify_aud": False},
            )
        except (jwt.PyJWTError, ValueError) as exc:
            raise AuthenticationFailed("Clerk session token could not be verified.") from exc
        return ClerkUser(claims), token

    def authenticate_header(self, request):
        return "Bearer"


def current_user_name(request) -> tuple[str, str]:
    user = getattr(request, "user", None)
    if isinstance(user, ClerkUser):
        claims = user.claims
        name = claims.get("name") or "Alya Pratama"
        metadata = claims.get("public_metadata") or {}
        student_id = claims.get("student_id") or metadata.get("studentId") or "2024010017"
        return str(name), str(student_id)
    return "Alya Pratama", "2024010017"