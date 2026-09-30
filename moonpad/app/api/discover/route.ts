import { NextResponse } from 'next/server';

type DexProfile = {
  chainId?: string;
  tokenAddress?: string;
  icon?: string;
};

type DexPair = {
  chainId?: string;
  baseToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  priceUsd?: string | null;
  marketCap?: number | null;
  fdv?: number | null;
  priceChange?: {
    h24?: number | null;
  };
  info?: {
    imageUrl?: string;
  };
};

export async function GET() {
  try {
    const profilesResponse = await fetch(
      'https://api.dexscreener.com/token-profiles/latest/v1',
      {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!profilesResponse.ok) {
      return NextResponse.json(
        {
          error: 'Unable to load token discovery data.',
        },
        { status: profilesResponse.status }
      );
    }

    const profiles =
      (await profilesResponse.json()) as DexProfile[];

    const solanaProfiles = profiles
      .filter(
        (profile) =>
          profile.chainId === 'solana' &&
          typeof profile.tokenAddress === 'string'
      )
      .slice(0, 20);

    const tokens = await Promise.all(
      solanaProfiles.map(async (profile) => {
        try {
          const response = await fetch(
            `https://api.dexscreener.com/token-pairs/v1/solana/${profile.tokenAddress}`,
            {
              headers: {
                Accept: 'application/json',
              },
              cache: 'no-store',
            }
          );

          if (!response.ok) {
            return null;
          }

          const pairs =
            (await response.json()) as DexPair[];

          const pair = pairs
            .filter(
              (item) =>
                item.baseToken?.address ===
                profile.tokenAddress
            )
            .sort(
              (a, b) =>
                (b.marketCap ?? b.fdv ?? 0) -
                (a.marketCap ?? a.fdv ?? 0)
            )[0];

          if (!pair?.baseToken?.name) {
            return null;
          }

          return {
            name: pair.baseToken.name,
            ticker: pair.baseToken.symbol
              ? `$${pair.baseToken.symbol}`
              : '$TOKEN',
            mc:
              pair.marketCap != null
                ? `$${formatCompact(pair.marketCap)}`
                : pair.fdv != null
                ? `$${formatCompact(pair.fdv)}`
                : '—',
            change:
              pair.priceChange?.h24 != null
                ? `${pair.priceChange.h24 >= 0 ? '+' : ''}${pair.priceChange.h24.toFixed(2)}%`
                : '—',
            holders: '—',
            status: 'LIVE',
            mint: profile.tokenAddress,
            image:
              pair.info?.imageUrl ||
              profile.icon ||
              '',
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({
      tokens: tokens.filter(Boolean),
    });
  } catch {
    return NextResponse.json(
      {
        error: 'Token discovery failed.',
      },
      { status: 500 }
    );
  }
}

function formatCompact(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toFixed(0);
}
