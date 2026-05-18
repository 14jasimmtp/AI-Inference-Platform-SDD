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
LUA_PEEK_RATE_LIMITER = """
local key      = KEYS[1]
local capacity = tonumber(ARGV[1])
local rate     = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last   = tonumber(bucket[2]) or now

local elapsed = now - last
tokens = math.min(capacity, tokens + elapsed * rate)

local retry_after = 0
if tokens < 1 then
    retry_after = math.ceil((1 - tokens) / rate)
end

return {math.floor(tokens * 1000), retry_after}
"""

class RateLimiter:
    def __init__(self, redis_url: str):
        try:
            self.redis = redis.from_url(redis_url, decode_responses=True)
            self.enabled = True
        except Exception as e:
            logger.error(f"Failed to initialize Redis for rate limiting: {e}")
            self.enabled = False
        self.script = None
        self.peek_script = None

    async def check_rate_limit(self, key_id: str, rpm: int):
        if not self.enabled:
            return {"limit": rpm, "remaining": rpm, "reset": 0}

        try:
            if not self.script:
                self.script = self.redis.register_script(LUA_RATE_LIMITER)
            
            key = f"ratelimit:{key_id}"
            rate = rpm / 60.0
            now = time.time()
            
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
                "remaining": int(remaining_tokens_ms / 1000.0),
                "reset": retry_after
            }
        except (redis.RedisError, ConnectionError) as e:
            logger.warning(f"Redis error in rate limiter: {e}. Allowing request.")
            return {"limit": rpm, "remaining": rpm, "reset": 0}

    async def peek_rate_limit(self, key_id: str, rpm: int):
        if not self.enabled:
            return {"limit": rpm, "remaining": rpm, "reset": 0}

        try:
            if not self.peek_script:
                self.peek_script = self.redis.register_script(LUA_PEEK_RATE_LIMITER)
            
            key = f"ratelimit:{key_id}"
            rate = rpm / 60.0
            now = time.time()
            
            result = await self.peek_script(keys=[key], args=[rpm, rate, now])
            remaining_tokens_ms, retry_after = result
            
            return {
                "limit": rpm,
                "remaining": int(remaining_tokens_ms / 1000.0),
                "reset": retry_after
            }
        except (redis.RedisError, ConnectionError) as e:
            return {"limit": rpm, "remaining": rpm, "reset": 0}

rate_limiter = RateLimiter(settings.REDIS_URL)
