from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field


@dataclass(slots=True)
class RateLimiter:
    rpm: int
    _tokens: float = field(default=0.0, init=False)
    _last: float = field(default_factory=time.monotonic, init=False)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, init=False)

    def __post_init__(self) -> None:
        self._tokens = float(self.rpm)

    async def acquire(self) -> None:
        if self.rpm <= 0:
            return
        async with self._lock:
            while True:
                now = time.monotonic()
                elapsed = now - self._last
                self._last = now
                self._tokens = min(float(self.rpm), self._tokens + elapsed * (self.rpm / 60.0))
                if self._tokens >= 1.0:
                    self._tokens -= 1.0
                    return
                deficit = 1.0 - self._tokens
                wait = deficit * (60.0 / self.rpm)
                await asyncio.sleep(wait)


class ProviderPacing:
    def __init__(self, overrides: dict[str, int] | None = None) -> None:
        defaults = {"groq": 30, "gemini": 1000, "ollama": 0}
        if overrides:
            defaults.update(overrides)
        self._limiters: dict[str, RateLimiter] = {
            name: RateLimiter(rpm=rpm) for name, rpm in defaults.items()
        }

    def get(self, provider: str) -> RateLimiter:
        if provider not in self._limiters:
            self._limiters[provider] = RateLimiter(rpm=0)
        return self._limiters[provider]
