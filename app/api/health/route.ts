import { NextResponse } from 'next/server';
import { APP_CONFIG } from '@/lib/config';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: APP_CONFIG.appName,
      timestamp: new Date().toISOString(),
      model: APP_CONFIG.gemini.model,
    },
    { status: 200 }
  );
}
