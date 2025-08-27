import { Redis } from '@upstash/redis';

export class CacheService {
  private redis: Redis;
  private readonly defaultTTL = 60 * 60 * 24 * 7; // 7 days in seconds

  constructor() {
    // Initialize Redis client with environment variables
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables are required'
      );
    }

    this.redis = new Redis({
      url,
      token,
    });
  }

  /**
   * Get a value from cache
   * @param key - The cache key
   * @returns Promise<T | null> - The cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value as T | null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds (optional, defaults to 7 days)
   * @returns Promise<boolean> - Success status
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const finalTTL = ttl || this.defaultTTL;
      await this.redis.setex(key, finalTTL, value);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   * @param key - The cache key
   * @returns Promise<boolean> - Success status
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   * @param key - The cache key
   * @returns Promise<boolean> - Whether the key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Generate a cache key for book text
   * @param bookId - The book ID
   * @returns string - The cache key
   */
  generateBookKey(bookId: string): string {
    return `book:${bookId}:text`;
  }

  /**
   * Generate a cache key for book analysis
   * @param bookId - The book ID
   * @returns string - The cache key
   */
  generateAnalysisKey(bookId: string): string {
    return `book:${bookId}:analysis`;
  }
}
