import { NextRequest, NextResponse } from 'next/server';
import { BookChatAgent, GroqLLMService, GutenbergService, type Message } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, bookId }: { messages: Message[]; bookId: string } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!bookId || typeof bookId !== 'string') {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Create services
    const llmService = new GroqLLMService();
    const gutenbergService = new GutenbergService();
    const chatAgent = BookChatAgent(llmService);

    // Fetch book text (with caching)
    const bookText = await gutenbergService.getBookText(bookId);

    // Create context message with book text
    const contextMessage: Message = {
      role: 'system',
      content: `You are a helpful assistant discussing the following book. Use this book text as your reference for answering questions:\n\n${bookText}\n\nPlease provide thoughtful, accurate responses based on the book content.`
    };

    // Combine context with user messages
    const messagesWithContext = [contextMessage, ...messages];

    // Get response from the agent
    const response = await chatAgent.chat(messagesWithContext);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
