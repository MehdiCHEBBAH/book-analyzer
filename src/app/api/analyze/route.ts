import { NextRequest, NextResponse } from 'next/server';
import {
  BookAnalysisAgent,
  GroqLLMService,
  GutenbergService,
  CacheService,
  type Message,
} from '@/lib/services';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');

  if (!bookId) {
    return NextResponse.json(
      { error: 'bookId parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Create service instances
    const gutenbergService = new GutenbergService();
    const llmService = new GroqLLMService();
    const analysisAgent = BookAnalysisAgent(llmService);
    const cacheService = new CacheService();

    // Check if analysis is already cached
    const analysisCacheKey = cacheService.generateAnalysisKey(bookId);
    const cachedAnalysis = await cacheService.get(analysisCacheKey);

    if (cachedAnalysis) {
      console.log(`Cache hit for analysis of book ${bookId}`);
      return NextResponse.json(cachedAnalysis);
    }

    console.log(
      `Cache miss for analysis of book ${bookId}, performing analysis...`
    );

    // Fetch book text from Project Gutenberg (with caching)
    const bookText = await gutenbergService.getBookText(bookId);

    // Analyze the book using the BookAnalysisAgent
    const analysisMessage: Message = {
      role: 'user',
      content: `Please analyze this book text and return ONLY a valid JSON object. Do not include any explanatory text, markdown formatting, or additional commentary. Your response must start with { and end with } and be parseable by JSON.parse().

Book text:
${bookText}`,
    };

    const analysisResponse = await analysisAgent.chat([analysisMessage]);

    // Enhanced JSON parsing with better error handling
    let parsedAnalysis;
    try {
      // Clean the response to remove any potential markdown formatting
      let cleanedResponse = analysisResponse.trim();

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
      }

      // Ensure the response starts and ends with JSON brackets
      if (!cleanedResponse.startsWith('{') || !cleanedResponse.endsWith('}')) {
        throw new Error('Response does not appear to be valid JSON object');
      }

      parsedAnalysis = JSON.parse(cleanedResponse);

      // Validate that the parsed JSON has the expected structure
      if (!parsedAnalysis || typeof parsedAnalysis !== 'object') {
        throw new Error('Parsed response is not a valid object');
      }

      // Log successful parsing for debugging
      console.log(
        'Successfully parsed JSON response with keys:',
        Object.keys(parsedAnalysis)
      );
    } catch (parseError) {
      console.error('Failed to parse agent response as JSON:', parseError);
      console.error('Raw response:', analysisResponse);
      console.error('Response length:', analysisResponse.length);
      console.error(
        'Response starts with:',
        analysisResponse.substring(0, 100)
      );
      console.error(
        'Response ends with:',
        analysisResponse.substring(analysisResponse.length - 100)
      );

      // Try to extract JSON from the response if it contains markdown or extra text
      try {
        const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('Attempting to extract JSON from response...');
          parsedAnalysis = JSON.parse(jsonMatch[0]);
          console.log(
            'Successfully extracted JSON with keys:',
            Object.keys(parsedAnalysis)
          );
        } else {
          throw new Error('No JSON object found in response');
        }
      } catch (extractError) {
        console.error('Failed to extract JSON from response:', extractError);
        return NextResponse.json(
          {
            error:
              'Invalid analysis response format - LLM did not return valid JSON',
            details:
              'The AI response could not be parsed as JSON. This may be due to the LLM including explanatory text or markdown formatting.',
          },
          { status: 500 }
        );
      }
    }

    // Transform the agent response to match UI expectations
    const transformedAnalysis = {
      characterRelationships:
        parsedAnalysis.characters?.flatMap(
          (character: {
            name: string;
            relationships?: Array<{ target: string; description: string }>;
          }) =>
            character.relationships?.map(rel => ({
              character1: character.name,
              character2: rel.target,
              relationship: rel.description,
              strength: 'moderate' as const, // Default strength, could be enhanced with sentiment analysis
            })) || []
        ) || [],
      keyCharacters:
        parsedAnalysis.characters?.map((char: { name: string }) => char.name) ||
        [],
      themes: parsedAnalysis.themes || [],
      summary: parsedAnalysis.plot_summary || 'No summary available',
      wordCount: bookText.split(/\s+/).length, // Approximate word count
    };

    // Return the structured analysis result
    const analysisResult = {
      bookId,
      title: `Book ID: ${bookId}`, // We don't have title from Gutenberg, could be enhanced
      author: parsedAnalysis.author || 'Unknown Author',
      analysis: transformedAnalysis,
      timestamp: new Date().toISOString(),
    };

    // Cache the analysis result
    await cacheService.set(analysisCacheKey, analysisResult);
    console.log(`Cached analysis for book ${bookId}`);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing book:', error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: `Book with ID ${bookId} not found` },
          { status: 404 }
        );
      }
      if (
        error.message.includes('timeout') ||
        error.message.includes('Network error')
      ) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }
      if (error.message.includes('GROQ_API_KEY')) {
        return NextResponse.json(
          { error: 'LLM service configuration error' },
          { status: 500 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Failed to analyze book' },
      { status: 500 }
    );
  }
}
