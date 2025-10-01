import { NextResponse } from 'next/server';
import { getMetrics } from '../../services/images.metrics';

export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...getMetrics() }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'metrics failed' }, { status: 500 });
  }
}
