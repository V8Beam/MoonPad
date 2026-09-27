import { NextResponse } from 'next/server';

const RPC_URL =
  process.env.SOLANA_RPC_URL;

export async function POST(
  request: Request
) {
  try {
    if (!RPC_URL) {
      return NextResponse.json(
        {
          error:
            'SOLANA_RPC_URL is not configured',
        },
        { status: 500 }
      );
    }

    const body =
      await request.text();

    const response =
      await fetch(RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body,
        cache: 'no-store',
      });

    const text =
      await response.text();

    return new NextResponse(
      text,
      {
        status:
          response.status,
        headers: {
          'Content-Type':
            'application/json',
        },
      }
    );
  } catch (error) {
    console.error(
      'MoonPad RPC proxy error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'RPC request failed',
      },
      { status: 500 }
    );
  }
}
