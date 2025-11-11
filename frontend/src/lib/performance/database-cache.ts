/**
 * Database Performance & Caching System
 * نظام تحسين أداء قاعدة البيانات والكاش
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * In-Memory Cache Implementation
 */
class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly maxSize: number = 100;
  private readonly defaultTTL: number = 60000; // 1 minute

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Check size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // To be implemented with hit/miss tracking
    };
  }
}

// Global cache instance
export const memoryCache = new MemoryCache();

/**
 * Cached Database Query Function
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    forceRefresh?: boolean;
    staleWhileRevalidate?: boolean;
  } = {}
): Promise<T> {
  const { ttl = 60000, forceRefresh = false, staleWhileRevalidate = false } = options;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = memoryCache.get<T>(key);
    
    if (cached !== null) {
      // Stale-while-revalidate strategy
      if (staleWhileRevalidate) {
        // Return stale data immediately and refresh in background
        queryFn().then(fresh => {
          memoryCache.set(key, fresh, ttl);
        }).catch(console.error);
      }
      
      return cached;
    }
  }

  // Execute query
  const data = await queryFn();
  
  // Cache the result
  memoryCache.set(key, data, ttl);
  
  return data;
}

/**
 * Batch Database Operations
 */
export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly batchDelay: number;
  private readonly processFn: (items: T[]) => Promise<R[]>;

  constructor(
    processFn: (items: T[]) => Promise<R[]>,
    batchSize: number = 100,
    batchDelay: number = 100
  ) {
    this.processFn = processFn;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  /**
   * Add item to batch
   */
  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const index = this.batch.length;
      this.batch.push(item);
      
      // Process if batch is full
      if (this.batch.length >= this.batchSize) {
        this.processBatch().then(results => {
          resolve(results[index]);
        }).catch(reject);
      } else {
        // Schedule batch processing
        if (!this.timer) {
          this.timer = setTimeout(() => {
            this.processBatch().then(results => {
              resolve(results[index]);
            }).catch(reject);
          }, this.batchDelay);
        }
      }
    });
  }

  /**
   * Process current batch
   */
  private async processBatch(): Promise<R[]> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    const items = [...this.batch];
    this.batch = [];
    
    if (items.length === 0) {
      return [];
    }
    
    return this.processFn(items);
  }
}

/**
 * Query Pagination Helper
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function buildPaginationQuery(
  baseQuery: string,
  options: PaginationOptions
): string {
  const { page, limit, orderBy, orderDirection = 'asc' } = options;
  const offset = (page - 1) * limit;
  
  let query = baseQuery;
  
  if (orderBy) {
    query += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;
  }
  
  query += ` LIMIT ${limit} OFFSET ${offset}`;
  
  return query;
}

/**
 * Database Connection Pool Manager
 */
export class ConnectionPool {
  private connections: any[] = [];
  private readonly maxConnections: number;
  private readonly createConnection: () => Promise<any>;

  constructor(
    createConnection: () => Promise<any>,
    maxConnections: number = 10
  ) {
    this.createConnection = createConnection;
    this.maxConnections = maxConnections;
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(): Promise<any> {
    // Return existing connection if available
    if (this.connections.length > 0) {
      return this.connections.pop();
    }
    
    // Create new connection if under limit
    if (this.connections.length < this.maxConnections) {
      return this.createConnection();
    }
    
    // Wait for a connection to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.connections.length > 0) {
          clearInterval(checkInterval);
          resolve(this.connections.pop());
        }
      }, 100);
    });
  }

  /**
   * Release connection back to pool
   */
  releaseConnection(connection: any): void {
    if (this.connections.length < this.maxConnections) {
      this.connections.push(connection);
    } else {
      // Close excess connection
      if (connection.close) {
        connection.close();
      }
    }
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    for (const conn of this.connections) {
      if (conn.close) {
        await conn.close();
      }
    }
    this.connections = [];
  }
}

/**
 * Query Optimization Analyzer
 */
export function analyzeQuery(query: string): {
  hasIndex: boolean;
  suggestions: string[];
  estimatedTime: string;
} {
  const suggestions: string[] = [];
  
  // Check for missing indexes
  if (query.includes('WHERE') && !query.includes('INDEX')) {
    suggestions.push('Consider adding indexes on WHERE clause columns');
  }
  
  // Check for SELECT *
  if (query.includes('SELECT *')) {
    suggestions.push('Avoid SELECT *, specify only needed columns');
  }
  
  // Check for JOIN without indexes
  if (query.includes('JOIN') && !query.includes('INDEX')) {
    suggestions.push('Ensure JOIN columns are indexed');
  }
  
  // Check for LIKE with leading wildcard
  if (query.includes('LIKE \'%')) {
    suggestions.push('Leading wildcards prevent index usage, consider full-text search');
  }
  
  // Check for ORDER BY without LIMIT
  if (query.includes('ORDER BY') && !query.includes('LIMIT')) {
    suggestions.push('Consider adding LIMIT when using ORDER BY');
  }
  
  return {
    hasIndex: query.includes('INDEX'),
    suggestions,
    estimatedTime: suggestions.length > 2 ? 'Slow' : 'Fast'
  };
}

/**
 * Redis-like Cache Interface (using localStorage for persistence)
 */
export class PersistentCache {
  private readonly prefix: string = 'cache_';

  /**
   * Set value with expiration
   */
  setex(key: string, value: any, ttlSeconds: number): void {
    const data = {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    };
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to cache:', e);
    }
  }

  /**
   * Get value
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      
      if (!item) return null;
      
      const data = JSON.parse(item);
      
      // Check expiration
      if (Date.now() > data.expires) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return data.value as T;
    } catch (e) {
      console.error('Failed to read from cache:', e);
      return null;
    }
  }

  /**
   * Delete key
   */
  del(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Clear all cache
   */
  flushall(): void {
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const persistentCache = new PersistentCache();

export default {
  memoryCache,
  cachedQuery,
  BatchProcessor,
  buildPaginationQuery,
  ConnectionPool,
  analyzeQuery,
  persistentCache
};
