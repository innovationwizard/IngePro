// Rate limiting utility for API security

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

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

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute 