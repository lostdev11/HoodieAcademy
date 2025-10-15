/**
 * Performance monitoring and optimization utilities
 */

/**
 * Simple cache with TTL (Time To Live)
 */
export class CacheWithTTL<T = any> {
  private cache = new Map<string, { data: T; expiry: number }>();

  set(key: string, data: T, ttlMs: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`⏱️ ${name} (failed): ${duration.toFixed(2)}ms`);
    throw error;
  }
}

/**
 * Batch multiple async operations
 */
export async function batchAsync<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(op => op()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Create a memoized version of an async function
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttlMs: number = 5 * 60 * 1000
): T {
  const cache = new CacheWithTTL();

  return (async (...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result, ttlMs);
    return result;
  }) as T;
}

/**
 * Performance observer for Web Vitals
 */
export function observeWebVitals() {
  if (typeof window === 'undefined') return;

  // Observe Largest Contentful Paint (LCP)
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('📊 LCP:', entry);
      }
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // PerformanceObserver not supported
  }

  // Log navigation timing
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        
        console.log('📊 Performance Metrics:');
        console.log(`  - Page Load: ${loadTime}ms`);
        console.log(`  - DOM Ready: ${domReady}ms`);
      }, 0);
    });
  }
}

/**
 * SessionStorage wrapper with type safety
 */
export const sessionCache = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('SessionStorage error:', e);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.clear();
  },

  getCached<T>(
    key: string,
    ttlMs: number = 5 * 60 * 1000
  ): { data: T; fresh: boolean } | null {
    const cacheKey = `${key}_cache`;
    const timeKey = `${key}_time`;
    
    const cachedData = this.get<T>(cacheKey);
    const cachedTime = this.get<number>(timeKey);
    
    if (!cachedData || !cachedTime) return null;
    
    const age = Date.now() - cachedTime;
    const fresh = age < ttlMs;
    
    return { data: cachedData, fresh };
  },

  setCached<T>(key: string, value: T): void {
    this.set(`${key}_cache`, value);
    this.set(`${key}_time`, Date.now());
  },
};

