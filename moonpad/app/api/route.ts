import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mint = searchParams.get('mint');

    if (!mint) {
      return NextResponse.json(
        { error: 'Missing token mint address' },
        { status: 400 }
      );
    }

    const apiKey = process.env.JUPITER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Jupiter API key is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.jup.ag/price/v3?ids=${encodeURIComponent(mint)}`,
      {
        headers: {
          'x-api-key': apiKey,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        { error: `Jupiter price request failed: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const price = data?.[mint]?.usdPrice;

    if (!price) {
      return NextResponse.json(
        { error: 'No price available for this token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      price: Number(price),
      entryPrice: Number(price),
    });
  } catch (error) {
    console.error('MoonPad price error:', error);

    return NextResponse.json(
      { error: 'Failed to retrieve token price' },
      { status: 500 }
    );
  }
}
