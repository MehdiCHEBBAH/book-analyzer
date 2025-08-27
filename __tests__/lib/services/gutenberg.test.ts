import axios from 'axios';
import { GutenbergService } from '../../../src/lib/services/gutenberg';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the cache service
jest.mock('../../../src/lib/services/cache', () => ({
  CacheService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null), // Default to cache miss
    set: jest.fn().mockResolvedValue(true),
    delete: jest.fn(),
    exists: jest.fn(),
    generateBookKey: jest.fn().mockReturnValue('book:test:text'),
    generateAnalysisKey: jest.fn(),
  })),
}));

describe('GutenbergService', () => {
  let gutenbergService: GutenbergService;

  beforeEach(() => {
    gutenbergService = new GutenbergService();
    jest.clearAllMocks();
  });

  describe('getBookText', () => {
    const mockBookId = '1342';
    const mockBookText =
      'The Project Gutenberg EBook of Pride and Prejudice, by Jane Austen...';

    it('should successfully fetch and return truncated book text', async () => {
      // Arrange
      const longBookText = 'A'.repeat(60000); // Text longer than maxTextLength (50000)
      mockedAxios.get.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: longBookText,
        headers: {},
        config: {} as any,
      });

      // Act
      const result = await gutenbergService.getBookText(mockBookId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://www.gutenberg.org/files/${mockBookId}/${mockBookId}-0.txt`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'BookAnalyzer/1.0 (https://github.com/your-repo)',
          },
        }
      );
      expect(result).toBe('A'.repeat(5000) + '...');
      expect(result.length).toBe(5003); // 5000 + '...'
    });

    it('should return full text when book is shorter than max length', async () => {
      // Arrange
      const shortBookText = 'Short book content';
      mockedAxios.get.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: shortBookText,
        headers: {},
        config: {} as any,
      });

      // Act
      const result = await gutenbergService.getBookText(mockBookId);

      // Assert
      expect(result).toBe(shortBookText);
      expect(result.length).toBe(shortBookText.length);
    });

    it('should handle 404 errors gracefully', async () => {
      // Arrange
      const axiosError = new Error('Not Found') as any;
      axiosError.isAxiosError = true;
      axiosError.response = { status: 404 };
      mockedAxios.get.mockRejectedValue(axiosError);

      // Act & Assert
      await expect(gutenbergService.getBookText('99999')).rejects.toThrow(
        'Book with ID 99999 not found'
      );
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const axiosError = new Error('timeout of 10000ms exceeded') as any;
      axiosError.isAxiosError = true;
      axiosError.code = 'ECONNABORTED';
      mockedAxios.get.mockRejectedValue(axiosError);

      // Act & Assert
      await expect(gutenbergService.getBookText(mockBookId)).rejects.toThrow(
        'Request timeout: Unable to fetch book text'
      );
    });

    it('should handle connection refused errors', async () => {
      // Arrange
      const axiosError = new Error('connect ECONNREFUSED') as any;
      axiosError.isAxiosError = true;
      axiosError.code = 'ECONNREFUSED';
      mockedAxios.get.mockRejectedValue(axiosError);

      // Act & Assert
      await expect(gutenbergService.getBookText(mockBookId)).rejects.toThrow(
        'Network error: Unable to connect to Project Gutenberg'
      );
    });

    it('should handle DNS resolution errors', async () => {
      // Arrange
      const axiosError = new Error('getaddrinfo ENOTFOUND') as any;
      axiosError.isAxiosError = true;
      axiosError.code = 'ENOTFOUND';
      mockedAxios.get.mockRejectedValue(axiosError);

      // Act & Assert
      await expect(gutenbergService.getBookText(mockBookId)).rejects.toThrow(
        'Network error: Unable to connect to Project Gutenberg'
      );
    });

    it('should handle other axios errors', async () => {
      // Arrange
      const axiosError = new Error('Some other network error') as any;
      axiosError.isAxiosError = true;
      mockedAxios.get.mockRejectedValue(axiosError);

      // Act & Assert
      await expect(gutenbergService.getBookText(mockBookId)).rejects.toThrow(
        'Network error: Some other network error'
      );
    });

    it('should handle non-200 HTTP status codes', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        data: 'Internal Server Error',
        headers: {},
        config: {} as any,
      });

      // Act & Assert
      await expect(gutenbergService.getBookText(mockBookId)).rejects.toThrow(
        'Failed to fetch book: HTTP 500'
      );
    });

    it('should handle invalid response format', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: null, // Invalid response format
        headers: {},
        config: {} as any,
      });

      // Act & Assert
      await expect(gutenbergService.getBookText(mockBookId)).rejects.toThrow(
        'Invalid response format: expected text content'
      );
    });

    it('should handle empty book ID', async () => {
      // Act & Assert
      await expect(gutenbergService.getBookText('')).rejects.toThrow(
        'Invalid book ID provided'
      );
    });

    it('should handle null book ID', async () => {
      // Act & Assert
      await expect(gutenbergService.getBookText(null as any)).rejects.toThrow(
        'Invalid book ID provided'
      );
    });

    it('should handle undefined book ID', async () => {
      // Act & Assert
      await expect(
        gutenbergService.getBookText(undefined as any)
      ).rejects.toThrow('Invalid book ID provided');
    });

    it('should handle whitespace-only book ID', async () => {
      // Act & Assert
      await expect(gutenbergService.getBookText('   ')).rejects.toThrow(
        'Invalid book ID provided'
      );
    });

    it('should trim whitespace from book ID', async () => {
      // Arrange
      const bookIdWithWhitespace = '  1342  ';
      mockedAxios.get.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: mockBookText,
        headers: {},
        config: {} as any,
      });

      // Act
      await gutenbergService.getBookText(bookIdWithWhitespace);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://www.gutenberg.org/files/1342/1342-0.txt`,
        expect.any(Object)
      );
    });

    it('should handle unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected error');
      mockedAxios.get.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(gutenbergService.getBookText(mockBookId)).rejects.toThrow(
        'Unexpected error'
      );
    });
  });
});
