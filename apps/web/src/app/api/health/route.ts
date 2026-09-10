import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'antarctic-digital-twin-web',
    timestamp: new Date().toISOString(),
  });
}
