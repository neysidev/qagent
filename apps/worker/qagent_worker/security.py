"""URL validation + SSRF guard: only public http(s) hosts."""

import asyncio
import ipaddress
import os
from urllib.parse import urlsplit

ALLOW_PRIVATE = os.environ.get("ALLOW_PRIVATE_URLS") == "1"  # local dev only, never in production

_BLOCKED_NETS = [
    ipaddress.ip_network(n)
    for n in (
        "0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16", "172.16.0.0/12",
        "192.168.0.0/16", "::1/128", "::/128", "fc00::/7", "fe80::/10",
    )
]
# ponytail: per-process cache, no TTL; DNS rebinding after first lookup is not caught.
_host_cache: dict[str, bool] = {}


def _ip_allowed(ip: str) -> bool:
    addr = ipaddress.ip_address(ip)
    if isinstance(addr, ipaddress.IPv6Address) and addr.ipv4_mapped:
        addr = addr.ipv4_mapped
    return not any(addr in net for net in _BLOCKED_NETS) and not addr.is_multicast and not addr.is_reserved


async def host_allowed(host: str) -> bool:
    if ALLOW_PRIVATE:
        return True
    if host in _host_cache:
        return _host_cache[host]
    try:
        infos = await asyncio.get_running_loop().getaddrinfo(host, None)
        ok = bool(infos) and all(_ip_allowed(info[4][0]) for info in infos)
    except (OSError, ValueError):
        ok = False
    _host_cache[host] = ok
    return ok


async def url_allowed(url: str) -> bool:
    parts = urlsplit(url)
    return parts.scheme in ("http", "https") and bool(parts.hostname) and await host_allowed(parts.hostname)


if __name__ == "__main__":
    assert not _ip_allowed("10.1.2.3") and not _ip_allowed("169.254.169.254") and not _ip_allowed("::1")
    assert not _ip_allowed("::ffff:127.0.0.1") and not _ip_allowed("172.20.0.1") and not _ip_allowed("fd00::1")
    assert _ip_allowed("8.8.8.8") and _ip_allowed("2606:4700::1111")
    assert not asyncio.run(url_allowed("file:///etc/passwd")) and not asyncio.run(url_allowed("http://localhost/"))
    print("ok")
