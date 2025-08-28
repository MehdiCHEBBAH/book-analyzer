import { GroqLLMService, type Message } from '../../../src/lib/services/llm';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

// Mock the AI SDK
jest.mock('@ai-sdk/groq', () => ({
  groq: jest.fn(model => ({ model, provider: 'groq' })),
}));

jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

describe('GroqLLMService', () => {
  let groqLLMService: GroqLLMService;
  let mockGenerateText: jest.MockedFunction<typeof generateText>;
  let mockGroq: jest.MockedFunction<typeof groq>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Get mocked functions
    mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;
    mockGroq = groq as jest.MockedFunction<typeof groq>;

    // Mock environment variable
    process.env.GROQ_API_KEY = 'test-api-key';

    groqLLMService = new GroqLLMService();
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  describe('constructor', () => {
    it('should throw error when GROQ_API_KEY is not set', () => {
      delete process.env.GROQ_API_KEY;
      expect(() => new GroqLLMService()).toThrow(
        'GROQ_API_KEY environment variable is required'
      );
    });

    it('should initialize successfully when GROQ_API_KEY is set', () => {
      expect(groqLLMService).toBeInstanceOf(GroqLLMService);
    });
  });

  describe('callLLM', () => {
    const mockMessages: Message[] = [
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing well, thank you!' },
    ];

    it('should successfully call the Groq API and return response content', async () => {
      const mockResult = {
        text: 'This is a test response from Groq API',
        content: 'This is a test response from Groq API',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      } as any;

      mockGenerateText.mockResolvedValueOnce(mockResult);

      const result = await groqLLMService.callLLM(mockMessages);

      expect(mockGroq).toHaveBeenCalledWith('openai/gpt-oss-120b');
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: { model: 'openai/gpt-oss-120b', provider: 'groq' },
        messages: mockMessages,
        temperature: 0.7,
      });
      expect(result).toBe('This is a test response from Groq API');
    });

    it('should handle empty response content', async () => {
      const mockResult = {
        text: '',
        content: '',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 0, totalTokens: 10 },
      } as any;

      mockGenerateText.mockResolvedValueOnce(mockResult);

      const result = await groqLLMService.callLLM(mockMessages);

      expect(result).toBe('');
    });

    it('should throw error when Groq API call fails', async () => {
      const apiError = new Error('API rate limit exceeded');
      mockGenerateText.mockRejectedValueOnce(apiError);

      await expect(groqLLMService.callLLM(mockMessages)).rejects.toThrow(
        'Groq API error: API rate limit exceeded'
      );
    });

    it('should throw generic error for non-Error objects', async () => {
      mockGenerateText.mockRejectedValueOnce('String error');

      await expect(groqLLMService.callLLM(mockMessages)).rejects.toThrow(
        'Unknown error occurred while calling Groq API'
      );
    });

    it('should pass messages with different roles correctly', async () => {
      const complexMessages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is the capital of France?' },
        { role: 'assistant', content: 'The capital of France is Paris.' },
        { role: 'user', content: 'What about Germany?' },
      ];

      const mockResult = {
        text: 'The capital of Germany is Berlin.',
        content: 'The capital of Germany is Berlin.',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      } as any;

      mockGenerateText.mockResolvedValueOnce(mockResult);

      await groqLLMService.callLLM(complexMessages);

      expect(mockGenerateText).toHaveBeenCalledWith({
        model: { model: 'openai/gpt-oss-120b', provider: 'groq' },
        messages: complexMessages,
        temperature: 0.7,
      });
    });

    it('should use custom environment variables when provided', async () => {
      process.env.GROQ_MODEL = 'custom-model';
      process.env.GROQ_TEMPERATURE = '0.5';

      const mockResult = {
        text: 'Custom response',
        content: 'Custom response',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      } as any;

      mockGenerateText.mockResolvedValueOnce(mockResult);

      await groqLLMService.callLLM(mockMessages);

      expect(mockGroq).toHaveBeenCalledWith('custom-model');
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: { model: 'custom-model', provider: 'groq' },
        messages: mockMessages,
        temperature: 0.5,
      });

      // Clean up
      delete process.env.GROQ_MODEL;
      delete process.env.GROQ_TEMPERATURE;
    });
  });
});
