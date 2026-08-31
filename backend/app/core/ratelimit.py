"""Shared slowapi limiter.

In-process, IP-keyed. `key_func` uses the client IP; behind a reverse proxy in
production the app should be run with `--forwarded-allow-ips` / `ProxyHeaders` so
`get_remote_address` sees the real client. Storage is in-memory (single instance);
point `storage_uri` at redis when running more than one instance.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=[])
