import { CacheService } from '@/lib/services/cache';

// Mock the Upstash Redis client
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => mockRedis),
}));

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set up environment variables
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

    cacheService = new CacheService();
  });

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      expect(cacheService).toBeInstanceOf(CacheService);
    });
  });

  describe('get', () => {
    it('should return cached value when key exists', async () => {
      const testValue = 'test-value';
      mockRedis.get.mockResolvedValue(testValue);

      const result = await cacheService.get<string>('test-key');

      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(testValue);
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get<string>('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get<string>('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const testValue = 'test-value';
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', testValue);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        604800,
        testValue
      );
      expect(result).toBe(true);
    });

    it('should set value with custom TTL', async () => {
      const testValue = 'test-value';
      const customTTL = 3600;
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', testValue, customTTL);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        customTTL,
        testValue
      );
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.set('test-key', 'test-value');

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete key successfully', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await cacheService.delete('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.delete('test-key');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await cacheService.exists('test-key');

      expect(mockRedis.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await cacheService.exists('test-key');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockRedis.exists.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.exists('test-key');

      expect(result).toBe(false);
    });
  });

  describe('generateBookKey', () => {
    it('should generate correct book key', () => {
      const bookId = '12345';
      const key = cacheService.generateBookKey(bookId);

      expect(key).toBe('book:12345:text');
    });
  });

  describe('generateAnalysisKey', () => {
    it('should generate correct analysis key', () => {
      const bookId = '12345';
      const key = cacheService.generateAnalysisKey(bookId);

      expect(key).toBe('book:12345:analysis');
    });
  });
});
