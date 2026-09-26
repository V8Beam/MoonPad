import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

function isPositiveInteger(value: string) {
  return /^\d+$/.test(value) && BigInt(value) > 0n;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      inputMint,
      outputMint,
      amount,
      userPublicKey,
      slippageBps = 100,
    } = body;

    if (!inputMint || !outputMint || !amount || !userPublicKey) {
      return NextResponse.json(
        { error: 'Missing swap parameters' },
        { status: 400 }
      );
    }

    try {
      new PublicKey(inputMint);
      new PublicKey(outputMint);
      new PublicKey(userPublicKey);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Solana address' },
        { status: 400 }
      );
    }

    if (!isPositiveInteger(String(amount))) {
      return NextResponse.json(
        { error: 'Swap amount must be a positive integer in base units' },
        { status: 400 }
      );
    }

    const safeSlippage = Math.min(
      Math.max(Number(slippageBps) || 100, 10),
      500
    );

    const apiKey = process.env.JUPITER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Jupiter API key is not configured' },
        { status: 500 }
      );
    }

    const quoteUrl =
      `https://api.jup.ag/swap/v1/quote` +
      `?inputMint=${encodeURIComponent(inputMint)}` +
      `&outputMint=${encodeURIComponent(outputMint)}` +
      `&amount=${encodeURIComponent(String(amount))}` +
      `&slippageBps=${safeSlippage}`;

    const quoteResponse = await fetch(quoteUrl, {
      headers: {
        'x-api-key': apiKey,
      },
      cache: 'no-store',
    });

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();

      return NextResponse.json(
        {
          error:
            errorText ||
            'No Jupiter route is available for this token and amount.',
        },
        { status: quoteResponse.status }
      );
    }

    const quoteResponseJson = await quoteResponse.json();

    if (!quoteResponseJson?.outAmount) {
      return NextResponse.json(
        { error: 'Jupiter returned an invalid quote' },
        { status: 502 }
      );
    }

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
          dynamicComputeUnitLimit: true,
          dynamicSlippage: true,
        }),
      }
    );

    if (!swapResponse.ok) {
      const errorText = await swapResponse.text();

      return NextResponse.json(
        {
          error:
            errorText ||
            'Jupiter could not build the swap transaction.',
        },
        { status: swapResponse.status }
      );
    }

    const swapResult = await swapResponse.json();

    if (!swapResult?.swapTransaction) {
      return NextResponse.json(
        { error: 'Jupiter did not return a swap transaction' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      swapTransaction: swapResult.swapTransaction,
      lastValidBlockHeight:
        swapResult.lastValidBlockHeight ?? null,
      prioritizationFeeLamports:
        swapResult.prioritizationFeeLamports ?? null,
      quote: {
        inputMint,
        outputMint,
        inAmount: quoteResponseJson.inAmount,
        outAmount: quoteResponseJson.outAmount,
        priceImpactPct:
          quoteResponseJson.priceImpactPct ?? null,
      },
    });
  } catch (error) {
    console.error('MoonPad swap error:', error);

    return NextResponse.json(
      { error: 'Failed to create swap transaction' },
      { status: 500 }
    );
  }
}
