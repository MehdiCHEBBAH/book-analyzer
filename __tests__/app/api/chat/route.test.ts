// Mock the services first
jest.mock('../../../../src/lib/services', () => ({
  BookChatAgent: jest.fn(() => ({
    chat: jest.fn(),
  })),
  GroqLLMService: jest.fn(),
  GutenbergService: jest.fn(),
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    body: string;
    constructor(url: string, options?: { method?: string; body?: string }) {
      this.url = url;
      this.method = options?.method || 'GET';
      this.body = options?.body || '';
    }

    async json() {
      try {
        return JSON.parse(this.body);
      } catch {
        throw new Error('Invalid JSON');
      }
    }
  },
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    })),
  },
}));

import { POST } from '../../../../src/app/api/chat/route';
import { NextRequest } from 'next/server';

describe('/api/chat', () => {
  let mockChatAgent: jest.Mocked<{
    chat: jest.Mock;
  }>;
  let mockGutenbergService: jest.Mocked<{
    getBookText: jest.Mock;
  }>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variable
    process.env.GROQ_API_KEY = 'test-api-key';

    // Get the mocked services and set up their methods
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const services = require('../../../../src/lib/services');

    // Create mock instances with proper methods
    mockChatAgent = {
      chat: jest.fn(),
    };

    mockGutenbergService = {
      getBookText: jest.fn(),
    };

    // Replace the constructor calls with our mock instances
    (services.BookChatAgent as jest.MockedFunction<typeof services.BookChatAgent>).mockImplementation(() => mockChatAgent);
    (services.GutenbergService as jest.MockedClass<typeof services.GutenbergService>).mockImplementation(() => mockGutenbergService);
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it('should return 400 when messages array is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Messages array is required');
  });

  it('should return 400 when messages is not an array', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: 'not an array' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Messages array is required');
  });

  it('should return 400 when bookId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Book ID is required');
  });

  it('should return 400 when bookId is not a string', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        messages: [{ role: 'user', content: 'Hello' }],
        bookId: 123
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Book ID is required');
  });

  it('should successfully process a simple chat message', async () => {
    const messages = [{ role: 'user', content: 'Hello, how are you?' }];
    const bookId = '1342';
    const bookText = 'Sample book text content';
    const expectedResponse = 'I am doing well, thank you for asking!';

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockChatAgent.chat.mockResolvedValueOnce(expectedResponse);

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, bookId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toBe(expectedResponse);
    expect(mockGutenbergService.getBookText).toHaveBeenCalledWith(bookId);
    expect(mockChatAgent.chat).toHaveBeenCalledWith([
      {
        role: 'system',
        content: expect.stringContaining(bookText)
      },
      ...messages
    ]);
  });

  it('should handle multi-turn conversation correctly', async () => {
    const messages = [
      { role: 'user', content: 'What is this book about?' },
      { role: 'assistant', content: 'This book is about a young wizard...' },
      { role: 'user', content: 'Who are the main characters?' },
    ];
    const bookId = '1342';
    const bookText = 'Sample book text content';
    const expectedResponse =
      'The main characters include Harry Potter, Ron Weasley, and Hermione Granger...';

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockChatAgent.chat.mockResolvedValueOnce(expectedResponse);

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, bookId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toBe(expectedResponse);
    expect(mockGutenbergService.getBookText).toHaveBeenCalledWith(bookId);
    expect(mockChatAgent.chat).toHaveBeenCalledWith([
      {
        role: 'system',
        content: expect.stringContaining(bookText)
      },
      ...messages
    ]);
  });

  it('should handle empty messages array', async () => {
    const messages: Array<{ role: string; content: string }> = [];
    const bookId = '1342';
    const bookText = 'Sample book text content';
    const expectedResponse = 'Hello! How can I help you today?';

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockChatAgent.chat.mockResolvedValueOnce(expectedResponse);

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, bookId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toBe(expectedResponse);
    expect(mockGutenbergService.getBookText).toHaveBeenCalledWith(bookId);
    expect(mockChatAgent.chat).toHaveBeenCalledWith([
      {
        role: 'system',
        content: expect.stringContaining(bookText)
      },
      ...messages
    ]);
  });

  it('should handle book-specific questions', async () => {
    const messages = [
      {
        role: 'user',
        content: 'In the book text provided, what happens in chapter 3?',
      },
    ];
    const bookId = '1342';
    const bookText = 'Sample book text content';
    const expectedResponse =
      'In chapter 3, the protagonist discovers a mysterious artifact...';

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockChatAgent.chat.mockResolvedValueOnce(expectedResponse);

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, bookId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toBe(expectedResponse);
    expect(mockGutenbergService.getBookText).toHaveBeenCalledWith(bookId);
    expect(mockChatAgent.chat).toHaveBeenCalledWith([
      {
        role: 'system',
        content: expect.stringContaining(bookText)
      },
      ...messages
    ]);
  });

  it('should handle errors from the chat agent', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const bookId = '1342';
    const bookText = 'Sample book text content';
    const error = new Error('LLM service error');

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockChatAgent.chat.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, bookId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('LLM service error');
  });

  it('should handle LLM service configuration errors', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const bookId = '1342';
    const bookText = 'Sample book text content';
    const error = new Error('GROQ_API_KEY environment variable is required');

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockChatAgent.chat.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, bookId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('GROQ_API_KEY environment variable is required');
  });

  it('should handle unknown errors', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const bookId = '1342';
    const bookText = 'Sample book text content';

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockChatAgent.chat.mockRejectedValueOnce('String error');

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, bookId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle malformed JSON in request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Invalid JSON');
  });
});
