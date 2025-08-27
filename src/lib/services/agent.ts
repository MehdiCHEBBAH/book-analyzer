import { AbstractLLMService, type Message } from './llm';

export class Agent {
  private llmService: AbstractLLMService;
  private systemPrompt: string;

  constructor(llmService: AbstractLLMService, systemPrompt: string) {
    this.llmService = llmService;
    this.systemPrompt = systemPrompt;
  }

  async chat(messages: Message[]): Promise<string> {
    const fullMessages: Message[] = [
      { role: 'system', content: this.systemPrompt },
      ...messages,
    ];

    return this.llmService.callLLM(fullMessages);
  }
}

// Book Analysis Agent for structured data analysis
export const BookAnalysisAgent = (llmService: AbstractLLMService) => {
  const systemPrompt = `You are a meticulous book analyzer. Your task is to analyze the provided book text and return a machine-readable JSON object containing character relationships and key plot elements.

CRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text, markdown formatting, or additional commentary before or after the JSON. Your response must be parseable by JSON.parse().

Return your analysis in the following JSON format:
{
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief description of the character",
      "relationships": [
        {
          "target": "Other Character Name",
          "relationship": "Type of relationship (friend, enemy, family, etc.)",
          "description": "Brief description of their relationship"
        }
      ]
    }
  ],
  "plot_summary": "A concise summary of the main plot",
  "themes": ["Theme 1", "Theme 2", "Theme 3"],
  "key_events": [
    {
      "event": "Description of the event",
      "significance": "Why this event is important"
    }
  ]
}

Be thorough in your analysis and ensure the JSON is valid and well-structured. Remember: ONLY return the JSON object, nothing else.`;

  return new Agent(llmService, systemPrompt);
};

// Book Chat Agent for general conversation about books
export const BookChatAgent = (llmService: AbstractLLMService) => {
  const systemPrompt = `You are a knowledgeable book expert with deep understanding of literature, characters, themes, and literary analysis. You can answer questions about any book based on the text provided to you.

Your responses should be:
- Informative and well-reasoned
- Engaging and conversational
- Based on the actual text content provided
- Helpful for readers who want to understand the book better

You can discuss:
- Character motivations and development
- Plot analysis and structure
- Themes and symbolism
- Literary techniques and style
- Historical and cultural context
- Comparisons with other works

Always base your answers on the text that has been shared with you, and be honest if you don't have enough information to answer a specific question.`;

  return new Agent(llmService, systemPrompt);
};
