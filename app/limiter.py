from fastapi import Request
from slowapi import Limiter

def get_real_client_ip(request: Request) -> str:
    """
    Extracts the real client IP address, properly handling reverse proxies (Render, Cloudflare, ALB).
    Reads the first (leftmost) IP from X-Forwarded-For header if present, falling back to
    X-Real-IP, and finally to request.client.host.
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
        if client_ip:
            return client_ip

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"

limiter = Limiter(key_func=get_real_client_ip)
