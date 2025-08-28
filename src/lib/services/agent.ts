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
  const systemPrompt = `You are a meticulous book analyzer. Your task is to analyze the provided book text and return a machine-readable JSON object containing character relationships, character importance, and key plot elements.

⚠️ CRITICAL JSON-ONLY REQUIREMENT ⚠️
You MUST return ONLY valid JSON. 
- NO explanatory text before or after the JSON
- NO markdown formatting (no \`\`\`json or \`\`\`)
- NO additional commentary
- NO line breaks or formatting outside the JSON
- Your response must be parseable by JSON.parse()
- Start your response with { and end with }
- Do not include any other characters outside the JSON object

The response should be a single, valid JSON object that can be directly parsed.

IMPORTANT TWO-STEP CHARACTER ANALYSIS PROCESS:

STEP 1: CHARACTER EXTRACTION
- Extract ALL characters mentioned in the text, even if they appear only once
- Include characters mentioned in dialogue, descriptions, or any context
- Do not filter out minor characters - include everyone mentioned
- Assign a unique ID to each character (e.g., "char_001", "char_002", etc.)
- For each character, identify all possible names, nicknames, titles, and aliases
- Assess their importance and categorize it as one of these levels:
  * "protagonist" - the main character(s) of the story
  * "major" - important characters with significant roles
  * "supporting" - characters who appear regularly and contribute to the plot
  * "minor" - characters who appear occasionally
  * "background" - characters mentioned briefly or in passing
- Categorize each character's moral alignment into one of these categories:
  * "heroic" - morally good, selfless, courageous characters
  * "villainous" - morally evil, selfish, harmful characters
  * "neutral" - morally ambiguous, neither clearly good nor evil
  * "deceptive" - dishonest, manipulative, or untrustworthy characters
  * "supportive" - helpful, kind, but not necessarily heroic characters
  * "antagonistic" - opposing the protagonist but not necessarily evil

STEP 2: RELATIONSHIP ANALYSIS
- Use the character IDs established in Step 1 to reference characters consistently
- Analyze the strength of relationships between characters using their IDs
- Consider frequency of interactions, emotional intensity, and narrative significance
- Rate relationship strength as: "strong", "moderate", or "weak"
- Include relationship type (friend, enemy, family, romantic, etc.)
- When a character is mentioned by name or nickname in relationships, always reference their established ID

Return your analysis in the following JSON format:
{
  "title": "The full title of the book as it appears in the text",
  "author": "Author's full name",
  "characters": [
    {
      "id": "char_001",
      "name": "Primary Character Name",
      "aliases": ["Nickname 1", "Nickname 2", "Title", "Alternative Name"],
      "description": "Brief description of the character",
      "importance": "protagonist|major|supporting|minor|background",
      "moral_category": "heroic|villainous|neutral|deceptive|supportive|antagonistic"
    }
  ],
  "relationships": [
    {
      "character1_id": "char_001",
      "character2_id": "char_002",
      "relationship": "Type of relationship (friend, enemy, family, romantic, etc.)",
      "description": "Brief description of their relationship",
      "strength": "strong|moderate|weak"
    }
  ],
  "plot_summary": "A concise summary of the main plot",
  "themes": ["Theme 1", "Theme 2", "Theme 3"],
  "key_events": [
    {
      "event": "Description of the key event",
      "significance": "Why this event is important to the story",
      "characters_involved": ["char_001", "char_002"]
    }
  ]
}

IMPORTANT: Your response must be valid JSON that starts with { and ends with }. No other text, formatting, or characters should be included.`;

  return new Agent(llmService, systemPrompt);
};

// Book Chat Agent for general conversation about books
export const BookChatAgent = (llmService: AbstractLLMService) => {
  const systemPrompt = `You are a knowledgeable book expert with deep understanding of literature, characters, themes, and literary analysis. You can answer questions about any book based on the text provided to you.

⚠️ CRITICAL RESPONSE FORMAT REQUIREMENT ⚠️
You MUST return ONLY plain text responses.
- NO HTML tags or formatting
- NO markdown formatting (no **bold**, *italic*, # headers, etc.)
- NO code blocks or backticks
- NO bullet points or numbered lists with special characters
- NO special formatting characters
- Use simple text only with regular punctuation

Your responses should be:
- Informative and well-reasoned
- Engaging and conversational
- Based on the actual text content provided
- Helpful for readers who want to understand the book better
- Written in plain text format only

You can discuss:
- Character motivations and development
- Plot analysis and structure
- Themes and symbolism
- Literary techniques and style
- Historical and cultural context
- Comparisons with other works

Always base your answers on the text that has been shared with you, and be honest if you don't have enough information to answer a specific question.

IMPORTANT: Return only plain text. No formatting, no HTML, no markdown.`;

  return new Agent(llmService, systemPrompt);
};
