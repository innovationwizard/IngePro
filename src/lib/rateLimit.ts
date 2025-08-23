// Rate limiting utility for API security

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Global store for rate limiting
const store: RateLimitStore = {};

// Get access to the store for cleanup operations
export function getRateLimitStore(): RateLimitStore {
  return store;
}

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `rate_limit_${identifier}`;
  
  if (!store[key] || now > store[key].resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs
    };
    return true;
  }
  
  if (store[key].count >= maxRequests) {
    return false;
  }
  
  store[key].count++;
  return true;
}

export function getRateLimitInfo(identifier: string): { remaining: number; resetTime: number } | null {
  const key = `rate_limit_${identifier}`;
  const entry = store[key];
  
  if (!entry) {
    return null;
  }
  
  const now = Date.now();
  if (now > entry.resetTime) {
    return null;
  }
  
  return {
    remaining: Math.max(0, 10 - entry.count),
    resetTime: entry.resetTime
  };
}

// Clean up expired entries (called by server cron job)
export async function cleanupExpiredEntries(): Promise<{
  cleanedEntries: number;
  remainingEntries: number;
}> {
  const now = Date.now();
  const initialCount = Object.keys(store).length;
  let cleanedCount = 0;
  
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
      cleanedCount++;
    }
  });
  
  const remainingCount = Object.keys(store).length;
  
  console.log(`Rate limit cleanup: Removed ${cleanedCount} expired entries, ${remainingCount} remaining`)
  
  return {
    cleanedEntries: cleanedCount,
    remainingEntries: remainingCount
  };
} 