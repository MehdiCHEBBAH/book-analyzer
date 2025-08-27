import { NextResponse } from 'next/server';

export async function GET() {
  const status = {
    service: 'Book Analyzer',
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    endpoints: [
      { path: '/api/hello', method: 'GET', status: 'active' },
      { path: '/api/health', method: 'GET', status: 'active' },
      { path: '/api/status', method: 'GET', status: 'active' },
    ],
  };

  return NextResponse.json(status);
}
