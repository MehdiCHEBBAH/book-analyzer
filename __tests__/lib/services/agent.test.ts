import {
  Agent,
  BookAnalysisAgent,
  BookChatAgent,
} from '../../../src/lib/services/agent';
import { GroqLLMService, type Message } from '../../../src/lib/services/llm';

// Mock the GroqLLMService
jest.mock('../../../src/lib/services/llm', () => ({
  ...jest.requireActual('../../../src/lib/services/llm'),
  GroqLLMService: jest.fn(),
}));

describe('Agent', () => {
  let mockLLMService: jest.Mocked<GroqLLMService>;
  let agent: Agent;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a mock LLM service
    mockLLMService = {
      callLLM: jest.fn(),
    } as any;

    // Mock environment variable for GroqLLMService constructor
    process.env.GROQ_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  describe('constructor', () => {
    it('should create an agent with the provided LLM service and system prompt', () => {
      const systemPrompt = 'You are a helpful assistant.';
      agent = new Agent(mockLLMService, systemPrompt);

      expect(agent).toBeInstanceOf(Agent);
    });
  });

  describe('chat method', () => {
    const systemPrompt = 'You are a helpful assistant.';
    const userMessages: Message[] = [
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing well, thank you!' },
      { role: 'user', content: 'What is the weather like?' },
    ];

    beforeEach(() => {
      agent = new Agent(mockLLMService, systemPrompt);
    });

    it('should prepend system prompt to user messages and call LLM service', async () => {
      const expectedResponse = 'The weather is sunny today!';
      mockLLMService.callLLM.mockResolvedValueOnce(expectedResponse);

      const result = await agent.chat(userMessages);

      // Verify that callLLM was called with the correct messages
      expect(mockLLMService.callLLM).toHaveBeenCalledWith([
        { role: 'system', content: systemPrompt },
        ...userMessages,
      ]);

      expect(result).toBe(expectedResponse);
    });

    it('should handle empty message array', async () => {
      const expectedResponse = 'Hello! How can I help you?';
      mockLLMService.callLLM.mockResolvedValueOnce(expectedResponse);

      const result = await agent.chat([]);

      expect(mockLLMService.callLLM).toHaveBeenCalledWith([
        { role: 'system', content: systemPrompt },
      ]);

      expect(result).toBe(expectedResponse);
    });

    it('should handle single message', async () => {
      const singleMessage: Message[] = [
        { role: 'user', content: 'What is 2+2?' },
      ];
      const expectedResponse = '2+2 equals 4.';
      mockLLMService.callLLM.mockResolvedValueOnce(expectedResponse);

      const result = await agent.chat(singleMessage);

      expect(mockLLMService.callLLM).toHaveBeenCalledWith([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'What is 2+2?' },
      ]);

      expect(result).toBe(expectedResponse);
    });

    it('should propagate errors from LLM service', async () => {
      const error = new Error('LLM service error');
      mockLLMService.callLLM.mockRejectedValueOnce(error);

      await expect(agent.chat(userMessages)).rejects.toThrow(
        'LLM service error'
      );
    });
  });
});

describe('BookAnalysisAgent', () => {
  let mockLLMService: jest.Mocked<GroqLLMService>;
  let bookAnalysisAgent: ReturnType<typeof BookAnalysisAgent>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLLMService = {
      callLLM: jest.fn(),
    } as any;
    process.env.GROQ_API_KEY = 'test-api-key';

    bookAnalysisAgent = BookAnalysisAgent(mockLLMService);
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it('should create an agent with book analysis system prompt', async () => {
    const sampleBookText = 'In a hole in the ground there lived a hobbit...';
    const expectedResponse = JSON.stringify({
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

    mockLLMService.callLLM.mockResolvedValueOnce(expectedResponse);

    const result = await bookAnalysisAgent.chat([
      { role: 'user', content: sampleBookText },
    ]);

    // Verify the system prompt contains book analysis instructions
    const callArgs = mockLLMService.callLLM.mock.calls[0][0];
    expect(callArgs[0].role).toBe('system');
    expect(callArgs[0].content).toContain('meticulous book analyzer');
    expect(callArgs[0].content).toContain('JSON format');
    expect(callArgs[0].content).toContain('characters');
    expect(callArgs[0].content).toContain('plot_summary');

    expect(result).toBe(expectedResponse);
  });

  it('should handle book analysis with complex text', async () => {
    const complexBookText = `
      Chapter 1: The Beginning
      Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.
    `;

    const expectedResponse = JSON.stringify({
      characters: [
        {
          name: 'Mr. Dursley',
          description: 'A normal man who lives on Privet Drive',
          relationships: [
            {
              target: 'Mrs. Dursley',
              relationship: 'spouse',
              description: 'Husband and wife',
            },
          ],
        },
      ],
      plot_summary: 'Introduction to the Dursley family',
      themes: ['Normalcy', 'Family'],
      key_events: [],
    });

    mockLLMService.callLLM.mockResolvedValueOnce(expectedResponse);

    const result = await bookAnalysisAgent.chat([
      { role: 'user', content: complexBookText },
    ]);

    expect(mockLLMService.callLLM).toHaveBeenCalledWith([
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('book analyzer'),
      }),
      { role: 'user', content: complexBookText },
    ]);

    expect(result).toBe(expectedResponse);
  });
});

describe('BookChatAgent', () => {
  let mockLLMService: jest.Mocked<GroqLLMService>;
  let bookChatAgent: ReturnType<typeof BookChatAgent>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLLMService = {
      callLLM: jest.fn(),
    } as any;
    process.env.GROQ_API_KEY = 'test-api-key';

    bookChatAgent = BookChatAgent(mockLLMService);
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it('should create an agent with book chat system prompt', async () => {
    const conversation: Message[] = [
      {
        role: 'user',
        content: 'Tell me about the main character in this book.',
      },
    ];
    const expectedResponse = 'The main character is a brave hero who...';

    mockLLMService.callLLM.mockResolvedValueOnce(expectedResponse);

    const result = await bookChatAgent.chat(conversation);

    // Verify the system prompt contains book expert instructions
    const callArgs = mockLLMService.callLLM.mock.calls[0][0];
    expect(callArgs[0].role).toBe('system');
    expect(callArgs[0].content).toContain('knowledgeable book expert');
    expect(callArgs[0].content).toContain('Character motivations');
    expect(callArgs[0].content).toContain('Themes and symbolism');

    expect(result).toBe(expectedResponse);
  });

  it('should handle multi-turn conversation correctly', async () => {
    const conversation: Message[] = [
      { role: 'user', content: 'What is this book about?' },
      { role: 'assistant', content: 'This book is about a young wizard...' },
      { role: 'user', content: 'Who are the main characters?' },
    ];
    const expectedResponse =
      'The main characters include Harry Potter, Ron Weasley, and Hermione Granger...';

    mockLLMService.callLLM.mockResolvedValueOnce(expectedResponse);

    const result = await bookChatAgent.chat(conversation);

    // Verify the full conversation history is passed
    expect(mockLLMService.callLLM).toHaveBeenCalledWith([
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('book expert'),
      }),
      { role: 'user', content: 'What is this book about?' },
      { role: 'assistant', content: 'This book is about a young wizard...' },
      { role: 'user', content: 'Who are the main characters?' },
    ]);

    expect(result).toBe(expectedResponse);
  });

  it('should handle questions about specific book content', async () => {
    const conversation: Message[] = [
      {
        role: 'user',
        content: 'In the book text provided, what happens in chapter 3?',
      },
    ];
    const expectedResponse =
      'In chapter 3, the protagonist discovers a mysterious artifact...';

    mockLLMService.callLLM.mockResolvedValueOnce(expectedResponse);

    const result = await bookChatAgent.chat(conversation);

    expect(mockLLMService.callLLM).toHaveBeenCalledWith([
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining(
          'Based on the actual text content provided'
        ),
      }),
      {
        role: 'user',
        content: 'In the book text provided, what happens in chapter 3?',
      },
    ]);

    expect(result).toBe(expectedResponse);
  });
});
