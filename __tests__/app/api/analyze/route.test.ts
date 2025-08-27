// Mock the services first
jest.mock('../../../../src/lib/services', () => ({
  BookAnalysisAgent: jest.fn(() => ({
    chat: jest.fn(),
  })),
  GroqLLMService: jest.fn(),
  GutenbergService: jest.fn(),
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  },
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    })),
  },
}));

import { GET } from '../../../../src/app/api/analyze/route';
import { NextRequest } from 'next/server';

describe('/api/analyze', () => {
  let mockGutenbergService: any;
  let mockAnalysisAgent: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variable
    process.env.GROQ_API_KEY = 'test-api-key';

    // Get the mocked services and set up their methods
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const services = require('../../../../src/lib/services');

    // Create mock instances with proper methods
    mockGutenbergService = {
      getBookText: jest.fn(),
    };

    mockAnalysisAgent = {
      chat: jest.fn(),
    };

    // Replace the constructor calls with our mock instances
    (services.GutenbergService as any).mockImplementation(
      () => mockGutenbergService
    );
    (services.BookAnalysisAgent as any).mockImplementation(
      () => mockAnalysisAgent
    );
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it('should return 400 when bookId parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('bookId parameter is required');
  });

  it('should return 400 when bookId parameter is empty', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/analyze?bookId='
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('bookId parameter is required');
  });

  it('should successfully analyze a book', async () => {
    const bookId = '12345';
    const bookText = 'In a hole in the ground there lived a hobbit...';
    const analysisResponse = JSON.stringify({
      characters: [
        {
          name: 'Bilbo Baggins',
          description: 'A hobbit who lives in a hole in the ground',
          relationships: [],
        },
      ],
      plot_summary: 'A hobbit goes on an adventure',
      themes: ['Adventure', 'Friendship'],
      key_events: [],
    });

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockAnalysisAgent.chat.mockResolvedValueOnce(analysisResponse);

    const request = new NextRequest(
      `http://localhost:3000/api/analyze?bookId=${bookId}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.bookId).toBe(bookId);
    expect(data.analysis).toEqual(JSON.parse(analysisResponse));
    expect(data.timestamp).toBeDefined();

    expect(mockGutenbergService.getBookText).toHaveBeenCalledWith(bookId);
    expect(mockAnalysisAgent.chat).toHaveBeenCalledWith([
      { role: 'user', content: bookText },
    ]);
  });

  it('should handle Gutenberg service errors', async () => {
    const bookId = '12345';
    const error = new Error('Book with ID 12345 not found');

    mockGutenbergService.getBookText.mockRejectedValueOnce(error);

    const request = new NextRequest(
      `http://localhost:3000/api/analyze?bookId=${bookId}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Book with ID 12345 not found');
  });

  it('should handle network timeout errors', async () => {
    const bookId = '12345';
    const error = new Error('Request timeout: Unable to fetch book text');

    mockGutenbergService.getBookText.mockRejectedValueOnce(error);

    const request = new NextRequest(
      `http://localhost:3000/api/analyze?bookId=${bookId}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Service temporarily unavailable');
  });

  it('should handle network connection errors', async () => {
    const bookId = '12345';
    const error = new Error(
      'Network error: Unable to connect to Project Gutenberg'
    );

    mockGutenbergService.getBookText.mockRejectedValueOnce(error);

    const request = new NextRequest(
      `http://localhost:3000/api/analyze?bookId=${bookId}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Service temporarily unavailable');
  });

  it('should handle LLM service configuration errors', async () => {
    const bookId = '12345';
    const bookText = 'Sample book text';
    const error = new Error('GROQ_API_KEY environment variable is required');

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockAnalysisAgent.chat.mockRejectedValueOnce(error);

    const request = new NextRequest(
      `http://localhost:3000/api/analyze?bookId=${bookId}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('LLM service configuration error');
  });

  it('should handle invalid JSON response from agent', async () => {
    const bookId = '12345';
    const bookText = 'Sample book text';
    const invalidResponse = 'This is not valid JSON';

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockAnalysisAgent.chat.mockResolvedValueOnce(invalidResponse);

    const request = new NextRequest(
      `http://localhost:3000/api/analyze?bookId=${bookId}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Invalid analysis response format');
  });

  it('should handle agent service errors', async () => {
    const bookId = '12345';
    const bookText = 'Sample book text';
    const error = new Error('LLM service error');

    mockGutenbergService.getBookText.mockResolvedValueOnce(bookText);
    mockAnalysisAgent.chat.mockRejectedValueOnce(error);

    const request = new NextRequest(
      `http://localhost:3000/api/analyze?bookId=${bookId}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('LLM service error');
  });

  it('should handle unknown errors', async () => {
    const bookId = '12345';
    const error = 'String error';

    mockGutenbergService.getBookText.mockRejectedValueOnce(error);

    const request = new NextRequest(
      `http://localhost:3000/api/analyze?bookId=${bookId}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to analyze book');
  });
});
