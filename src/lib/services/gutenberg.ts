import axios from 'axios';
import { CacheService } from './cache';

export class GutenbergService {
  private readonly baseUrl = 'https://www.gutenberg.org/files';
  private readonly maxTextLength = 5000; // Reduced for testing with API limits
  private readonly cacheService: CacheService;

  constructor() {
    this.cacheService = new CacheService();
  }

  /**
   * Fetches the raw text of a book from Project Gutenberg with caching
   * @param bookId - The Project Gutenberg book ID
   * @returns Promise<string> - The book text (truncated to maxTextLength characters)
   * @throws Error - If the book ID is invalid or the network request fails
   */
  async getBookText(bookId: string): Promise<string> {
    try {
      // Validate book ID
      if (!bookId || typeof bookId !== 'string' || bookId.trim() === '') {
        throw new Error('Invalid book ID provided');
      }

      const cleanBookId = bookId.trim();
      const cacheKey = this.cacheService.generateBookKey(cleanBookId);

      // Try to get from cache first
      const cachedText = await this.cacheService.get<string>(cacheKey);
      if (cachedText) {
        console.log(`Cache hit for book ${cleanBookId}`);
        return cachedText;
      }

      console.log(
        `Cache miss for book ${cleanBookId}, fetching from Gutenberg...`
      );

      const url = `${this.baseUrl}/${cleanBookId}/${cleanBookId}-0.txt`;

      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'BookAnalyzer/1.0 (https://github.com/your-repo)',
        },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch book: HTTP ${response.status}`);
      }

      const bookText = response.data;

      if (!bookText || typeof bookText !== 'string') {
        throw new Error('Invalid response format: expected text content');
      }

      // Truncate the text to optimize for LLM processing
      const truncatedText =
        bookText.length > this.maxTextLength
          ? bookText.substring(0, this.maxTextLength) + '...'
          : bookText;

      // Cache the result
      await this.cacheService.set(cacheKey, truncatedText);
      console.log(`Cached book ${cleanBookId} text`);

      return truncatedText;
    } catch (error) {
      // Check if it's an Axios error by checking the isAxiosError property
      if ((error as { isAxiosError?: boolean })?.isAxiosError) {
        const axiosError = error as {
          isAxiosError: boolean;
          response?: { status: number };
          code?: string;
          message: string;
        };
        if (axiosError.response?.status === 404) {
          throw new Error(`Book with ID ${bookId} not found`);
        }
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error('Request timeout: Unable to fetch book text');
        }
        if (
          axiosError.code === 'ENOTFOUND' ||
          axiosError.code === 'ECONNREFUSED'
        ) {
          throw new Error(
            'Network error: Unable to connect to Project Gutenberg'
          );
        }
        throw new Error(`Network error: ${axiosError.message}`);
      }

      // Re-throw our custom errors
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unexpected error occurred while fetching the book');
    }
  }
}
