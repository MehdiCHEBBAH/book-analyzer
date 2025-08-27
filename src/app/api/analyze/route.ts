import { NextRequest, NextResponse } from 'next/server';
import {
  BookAnalysisAgent,
  GroqLLMService,
  GutenbergService,
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

    // Fetch book text from Project Gutenberg
    const bookText = await gutenbergService.getBookText(bookId);

    // Analyze the book using the BookAnalysisAgent
    const analysisMessage: Message = {
      role: 'user',
      content: bookText,
    };

    const analysisResponse = await analysisAgent.chat([analysisMessage]);

    // Parse the JSON response from the agent
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysisResponse);
    } catch (parseError) {
      console.error('Failed to parse agent response as JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid analysis response format' },
        { status: 500 }
      );
    }

    // Transform the agent response to match UI expectations
    const transformedAnalysis = {
      characterRelationships:
        parsedAnalysis.characters?.flatMap(
          (character: any) =>
            character.relationships?.map((rel: any) => ({
              character1: character.name,
              character2: rel.target,
              relationship: rel.description,
              strength: 'moderate' as const, // Default strength, could be enhanced with sentiment analysis
            })) || []
        ) || [],
      keyCharacters:
        parsedAnalysis.characters?.map((char: any) => char.name) || [],
      themes: parsedAnalysis.themes || [],
      summary: parsedAnalysis.plot_summary || 'No summary available',
      wordCount: bookText.split(/\s+/).length, // Approximate word count
    };

    // Return the structured analysis result
    const analysisResult = {
      bookId,
      title: `Book ID: ${bookId}`, // We don't have title from Gutenberg, could be enhanced
      author: 'Unknown Author', // We don't have author from Gutenberg, could be enhanced
      analysis: transformedAnalysis,
      timestamp: new Date().toISOString(),
    };

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
