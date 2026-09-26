import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { inputMint, outputMint, amount, userPublicKey } = body;

    if (!inputMint || !outputMint || !amount || !userPublicKey) {
      return NextResponse.json(
        { error: 'Missing swap parameters' },
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

    const quoteResponse = await fetch(
      `https://api.jup.ag/swap/v1/quote?inputMint=${encodeURIComponent(
        inputMint
      )}&outputMint=${encodeURIComponent(
        outputMint
      )}&amount=${encodeURIComponent(amount)}&slippageBps=100`,
      {
        headers: {
          'x-api-key': apiKey,
        },
      }
    );

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();

      return NextResponse.json(
        { error: `Jupiter quote failed: ${errorText}` },
        { status: quoteResponse.status }
      );
    }

    const quoteResponseJson = await quoteResponse.json();

    const swapResponse = await fetch(
      'https://api.jup.ag/swap/v1/swap',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          quoteResponse: quoteResponseJson,
          userPublicKey,
          wrapAndUnwrapSol: true,
        }),
      }
    );

    if (!swapResponse.ok) {
      const errorText = await swapResponse.text();

      return NextResponse.json(
        { error: `Jupiter swap failed: ${errorText}` },
        { status: swapResponse.status }
      );
    }

    const swapResult = await swapResponse.json();

    return NextResponse.json({
      swapTransaction: swapResult.swapTransaction,
      lastValidBlockHeight: swapResult.lastValidBlockHeight,
    });
  } catch (error) {
    console.error('MoonPad swap error:', error);

    return NextResponse.json(
      { error: 'Failed to create swap transaction' },
      { status: 500 }
    );
  }
}
