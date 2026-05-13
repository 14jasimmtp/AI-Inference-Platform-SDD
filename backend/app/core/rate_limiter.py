import time
import logging
import redis.asyncio as redis
from app.config import settings
from app.exceptions import RateLimitError

logger = logging.getLogger(__name__)

LUA_RATE_LIMITER = """
local key      = KEYS[1]
local capacity = tonumber(ARGV[1])       -- = rpm
local rate     = tonumber(ARGV[2])       -- tokens/sec = rpm / 60
local now      = tonumber(ARGV[3])       -- time.time()
local ttl      = tonumber(ARGV[4])       -- REDIS_BUCKET_TTL_SECONDS

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last   = tonumber(bucket[2]) or now

local elapsed = now - last
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens < 1 then
    return {0, math.floor(tokens * 1000), math.ceil((1 - tokens) / rate)}
end

tokens = tokens - 1
redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
redis.call('EXPIRE', key, ttl)
return {1, math.floor(tokens * 1000), 0}
"""

class RateLimiter:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.script = None

    async def check_rate_limit(self, key_id: str, rpm: int):
        if not self.script:
            self.script = self.redis.register_script(LUA_RATE_LIMITER)
        
        key = f"ratelimit:{key_id}"
        rate = rpm / 60.0
        now = time.time()
        
        # [allowed, remaining_millis, retry_after]
        result = await self.script(
            keys=[key],
            args=[rpm, rate, now, settings.REDIS_BUCKET_TTL_SECONDS]
        )
        
        allowed, remaining_tokens_ms, retry_after = result
        
        if not allowed:
            logger.warning(
                "Rate limit exceeded", 
                extra={"key_id": key_id, "retry_after": retry_after}
            )
            raise RateLimitError(
                message=f"Rate limit exceeded. Retry after {retry_after}s",
                details={"retry_after": retry_after}
            )
            
        return {
            "limit": rpm,
            "remaining": remaining_tokens_ms / 1000.0,
            "reset": retry_after
        }

rate_limiter = RateLimiter(settings.REDIS_URL)
