# api\app\dependencies.py
from typing import Literal, Optional

import httpx
import jwt
from fastapi import Depends, Header, HTTPException, status
from supabase import Client, ClientOptions, create_client

from .config import Settings, get_settings
from .schemas import AuthUser

# Use a valid UUID string for the fake local dev user
LOCAL_DEV_USER_ID = "00000000-0000-0000-0000-000000000001"


_supabase_service_client: Client | None = None
_jwk_client: jwt.PyJWKClient | None = None

# Patch httpx.Client to accept `proxy` kwarg used by supabase library
_orig_httpx_client_init = httpx.Client.__init__


def _httpx_client_init_proxy_safe(self, *args, proxy=None, **kwargs):
    if proxy is not None and "proxies" not in kwargs:
        kwargs["proxies"] = proxy
    return _orig_httpx_client_init(self, *args, **kwargs)


httpx.Client.__init__ = _httpx_client_init_proxy_safe


def supabase_service_client(settings: Settings) -> Client:
    global _supabase_service_client
    if _supabase_service_client is None:
        _supabase_service_client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _supabase_service_client


def get_supabase_service_client(settings: Settings = Depends(get_settings)) -> Client:
    return supabase_service_client(settings)


def _decode_supabase_jwt(token: str, settings: Settings) -> dict:
    global _jwk_client
    # If a JWT secret is provided (HS256), try that first to avoid network hiccups on jwks fetch.
    if settings.supabase_jwt_secret:
        try:
            return jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.PyJWTError:
            pass
    try:
        if _jwk_client is None:
            _jwk_client = jwt.PyJWKClient(f"{settings.supabase_url}/auth/v1/keys")
        signing_key = _jwk_client.get_signing_key_from_jwt(token).key
        # Supabase can use RS256 (legacy), ES256 (new P-256), or HS256 (legacy shared secret)
        return jwt.decode(
            token,
            signing_key,
            algorithms=["RS256", "ES256", "HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc


def _ensure_user_records(user_id: str, role: str, settings: Settings) -> None:
    """
    Make sure a corresponding users row (and role-specific profile) exists to avoid FK/RLS issues.
    Uses the service client to bypass RLS safely.
    """
    try:
        client = supabase_service_client(settings)
        client.table("users").upsert({"id": user_id, "role": role}).execute()
        if role == "candidate":
            client.table("candidates").upsert({"id": user_id}).execute()
        elif role == "recruiter":
            client.table("recruiters").upsert({"id": user_id}).execute()
    except Exception as exc:
        # Fail-soft in case of schema drift; don't block auth flow.
        print("Warning: could not ensure user records:", exc)


async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_debug_role: Optional[str] = Header(None),
    settings: Settings = Depends(get_settings),
) -> AuthUser:
    # In local mode, allow forcing a role via header and skip JWT entirely.
    if settings.app_env.lower() == "local" and x_debug_role:
        role = str(x_debug_role)
        _ensure_user_records(LOCAL_DEV_USER_ID, role, settings)
        return AuthUser(user_id=LOCAL_DEV_USER_ID, role=role, token=None)

    # Local/dev bypass: allow setting a role without JWT to speed up development
    if (not authorization or not authorization.lower().startswith("bearer ")) and settings.app_env.lower() == "local":
        # Default to recruiter in local/dev to unblock recruiter flows; override via X-Debug-Role.
        role = x_debug_role or "recruiter"
        _ensure_user_records(LOCAL_DEV_USER_ID, str(role), settings)
        return AuthUser(user_id=LOCAL_DEV_USER_ID, role=str(role), token=None)

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token"
        )

    token = authorization.split(" ", 1)[1]

    # Handle obvious bad tokens in local mode
    if settings.app_env.lower() == "local" and token in ("null", "undefined", ""):
        role = x_debug_role or "candidate"
        _ensure_user_records(LOCAL_DEV_USER_ID, str(role), settings)
        return AuthUser(user_id=LOCAL_DEV_USER_ID, role=str(role), token=None)

    try:
        claims = _decode_supabase_jwt(token, settings)
    except HTTPException:
        if settings.app_env.lower() == "local":
            role = x_debug_role or "candidate"
            _ensure_user_records(LOCAL_DEV_USER_ID, str(role), settings)
            return AuthUser(user_id=LOCAL_DEV_USER_ID, role=str(role), token=None)
        raise

    # Roles can come from multiple places depending on Supabase JWT config
    role = (
        claims.get("role")
        or claims.get("app_metadata", {}).get("role")
        or claims.get("user_metadata", {}).get("role")
    )
    user_id = claims.get("sub") or claims.get("user_id")

    # In local dev, tolerate Supabase tokens that are missing or using the generic "authenticated" role
    # by honoring X-Debug-Role or defaulting to recruiter to keep dashboards usable.
    if settings.app_env.lower() == "local":
        if x_debug_role:
            role = str(x_debug_role)
        if not role or role == "authenticated":
            role = "recruiter"

    if role == "authenticated":
        role = "candidate"

    if not role or not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Missing role or user"
        )

    # Ensure backing rows exist to avoid FK issues on first requests after signup/login.
    _ensure_user_records(str(user_id), str(role), settings)
    return AuthUser(user_id=str(user_id), role=str(role), token=token)


def get_supabase_user_client(
    user: AuthUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> Client:
    """
    Returns a Supabase client that uses the anon key and carries the user's JWT for RLS.
    """
    # In local/dev without JWT, fall back to service client to avoid RLS blocking development
    if settings.app_env.lower() == "local" and not user.token:
        return supabase_service_client(settings)
    headers = {"Authorization": f"Bearer {user.token}"} if user.token else {}
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
        options=ClientOptions(headers=headers),
    )


def require_role(*allowed: Literal["admin", "recruiter", "candidate", "authenticated"]):
    async def checker(
        user: AuthUser = Depends(get_current_user),
        settings: Settings = Depends(get_settings),
    ) -> AuthUser:
        # In local/dev, allow optional bypass to keep flows unblocked.
        if settings.app_env.lower() == "local" and settings.disable_role_checks_local:
            return user
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {user.role} not permitted for this endpoint",
            )
        return user

    return checker
