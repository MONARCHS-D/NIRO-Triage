"""Check local prerequisites without printing credentials or contacting services."""

from __future__ import annotations

import sys

from pydantic import ValidationError

from careintel.core.config import Settings


def main() -> int:
    if sys.version_info[:2] != (3, 12):
        print("FAIL: Python 3.12 is required; use .venv/bin/python.")
        return 1
    try:
        settings = Settings()
    except ValidationError as exc:
        fields = sorted({".".join(map(str, error["loc"])) for error in exc.errors()})
        print(f"FAIL: Invalid configuration fields: {', '.join(fields)}")
        return 1
    try:
        import magic

        magic.from_buffer(b"CareIntel setup check", mime=True)
    except (ImportError, OSError) as exc:
        print(f"FAIL: libmagic is unavailable ({type(exc).__name__}).")
        print("On Debian/Ubuntu install it with: sudo apt-get install libmagic1")
        return 1

    print("PASS: Python 3.12, installed package, settings validation, and libmagic")
    print(f"Environment: {settings.app_env.value}")
    print(f"API: http://{settings.app_host}:{settings.app_port}")
    print("Service connectivity is checked separately by scripts/verify_infra.py.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
