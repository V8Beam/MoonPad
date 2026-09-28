import { NextResponse } from 'next/server';

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const mint =
      searchParams.get('mint')?.trim();

    if (!mint) {
      return NextResponse.json(
        {
          error:
            'Token mint is required.',
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.dexscreener.com/tokens/v1/solana/${encodeURIComponent(
        mint
      )}`,
      {
        cache: 'no-store',
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            'Unable to find token market data.',
        },
        { status: 502 }
      );
    }

    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'No market data found for this token.',
        },
        { status: 404 }
      );
    }

    const pairs = data
      .filter(
        (pair: any) =>
          pair?.baseToken?.address ===
          mint
      )
      .sort(
        (a: any, b: any) =>
          Number(
            b?.liquidity?.usd || 0
          ) -
          Number(
            a?.liquidity?.usd || 0
          )
      );

    const pair =
      pairs[0] || data[0];

    const token =
      pair?.baseToken;

    if (!token) {
      return NextResponse.json(
        {
          error:
            'Token information was not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mint,

      name:
        token.name || 'Unknown Token',

      symbol:
        token.symbol || 'UNKNOWN',

      image:
        pair?.info?.imageUrl || null,

      priceUsd:
        pair?.priceUsd
          ? Number(pair.priceUsd)
          : null,

      marketCap:
        pair?.marketCap
          ? Number(pair.marketCap)
          : pair?.fdv
          ? Number(pair.fdv)
          : null,

      fdv:
        pair?.fdv
          ? Number(pair.fdv)
          : null,

      liquidity:
        pair?.liquidity?.usd
          ? Number(
              pair.liquidity.usd
            )
          : null,

      volume24h:
        pair?.volume?.h24
          ? Number(
              pair.volume.h24
            )
          : null,

      priceChange24h:
        pair?.priceChange?.h24
          ? Number(
              pair.priceChange.h24
            )
          : null,

      dex:
        pair?.dexId || null,

      pairAddress:
        pair?.pairAddress || null,

      url:
        pair?.url || null,

      pairCount:
        pairs.length,
    });
  } catch (error) {
    console.error(
      'MoonPad token discovery error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Token discovery failed.',
      },
      { status: 500 }
    );
  }
}
