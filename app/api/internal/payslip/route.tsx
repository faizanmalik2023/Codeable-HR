import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { PayslipDocument, PayslipPayload } from '@/lib/payslip/PayslipDocument';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-render-secret');
  if (!process.env.PAYSLIP_RENDER_SECRET || secret !== process.env.PAYSLIP_RENDER_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: PayslipPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  if (!payload?.slip || !Array.isArray(payload.incomeRows) || !Array.isArray(payload.deductionRows)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf = await renderToBuffer(React.createElement(PayslipDocument, payload) as any);
    return new Response(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'inline; filename="payslip.pdf"',
      },
    });
  } catch (e) {
    console.error('payslip render failed', e);
    return NextResponse.json({ error: 'render_failed' }, { status: 500 });
  }
}
