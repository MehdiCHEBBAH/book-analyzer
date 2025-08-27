import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/services';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const bookId = searchParams.get('bookId');

  const cacheService = new CacheService();

  try {
    switch (action) {
      case 'status':
        // Return cache status for a specific book
        if (!bookId) {
          return NextResponse.json(
            { error: 'bookId parameter is required for status action' },
            { status: 400 }
          );
        }

        const bookKey = cacheService.generateBookKey(bookId);
        const analysisKey = cacheService.generateAnalysisKey(bookId);

        const bookExists = await cacheService.exists(bookKey);
        const analysisExists = await cacheService.exists(analysisKey);

        return NextResponse.json({
          bookId,
          bookTextCached: bookExists,
          analysisCached: analysisExists,
          timestamp: new Date().toISOString(),
        });

      case 'clear':
        // Clear cache for a specific book or all books
        if (bookId) {
          // Clear specific book cache
          const bookKey = cacheService.generateBookKey(bookId);
          const analysisKey = cacheService.generateAnalysisKey(bookId);

          await cacheService.delete(bookKey);
          await cacheService.delete(analysisKey);

          return NextResponse.json({
            message: `Cache cleared for book ${bookId}`,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Note: In a production environment, you might want to implement
          // a more sophisticated way to clear all cache entries
          return NextResponse.json({
            message: 'Please specify bookId to clear specific book cache',
            note: 'Bulk cache clearing not implemented for safety',
            timestamp: new Date().toISOString(),
          });
        }

      default:
        return NextResponse.json(
          {
            error: 'Invalid action. Supported actions: status, clear',
            usage: {
              status: 'GET /api/cache?action=status&bookId=123',
              clear: 'GET /api/cache?action=clear&bookId=123',
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cache operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform cache operation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');

  if (!bookId) {
    return NextResponse.json(
      { error: 'bookId parameter is required' },
      { status: 400 }
    );
  }

  const cacheService = new CacheService();

  try {
    const bookKey = cacheService.generateBookKey(bookId);
    const analysisKey = cacheService.generateAnalysisKey(bookId);

    await cacheService.delete(bookKey);
    await cacheService.delete(analysisKey);

    return NextResponse.json({
      message: `Cache cleared for book ${bookId}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
