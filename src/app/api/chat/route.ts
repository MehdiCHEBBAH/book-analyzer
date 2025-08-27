import { NextRequest, NextResponse } from 'next/server';
import { BookChatAgent, GroqLLMService, type Message } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages }: { messages: Message[] } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Create LLM service and chat agent
    const llmService = new GroqLLMService();
    const chatAgent = BookChatAgent(llmService);

    // Get response from the agent
    const response = await chatAgent.chat(messages);

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
