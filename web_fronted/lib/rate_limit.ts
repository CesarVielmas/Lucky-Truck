import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  interval: number;
  uniqueTokenPerInterval: number;
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: (token: string, limit: number) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0];
      
      if (tokenCount[0] === 0) {
        tokenCache.set(token, tokenCount);
      }
      
      tokenCount[0] += 1;

      const currentUsage = tokenCount[0];
      const isRateLimited = currentUsage >= limit;

      return isRateLimited;
    },
  };
}