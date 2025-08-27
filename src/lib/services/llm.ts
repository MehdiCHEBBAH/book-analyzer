import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export interface Message {
  role: string;
  content: string;
}

export abstract class AbstractLLMService {
  abstract callLLM(messages: Message[]): Promise<string>;
}

export class GroqLLMService extends AbstractLLMService {
  constructor() {
    super();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
  }

  async callLLM(messages: Message[]): Promise<string> {
    try {
      const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
      const temperature = parseFloat(process.env.GROQ_TEMPERATURE || '0.7');

      const result = await generateText({
        model: groq(model),
        messages: messages as any, // AI SDK expects specific message types
        temperature,
      });

      return result.text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Groq API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling Groq API');
    }
  }
}
