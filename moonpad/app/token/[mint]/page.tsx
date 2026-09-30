'use client';

import { useEffect, useState } from 'react';

type TokenData = {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  priceUsd?: number | null;
  marketCap?: number | null;
  fdv?: number | null;
  liquidity?: number | null;
  volume24h?: number | null;
  priceChange24h?: number | null;
  dex?: string;
  pairAddress?: string;
  url?: string;
};

function formatUsd(value?: number | null) {
  if (value === null || value === undefined) {
    return '—';
  }

  if (value < 0.01) {
    return `$${value.toFixed(8)}`;
  }

  return `$${value.toLocaleString(
    'en-US',
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) {
    return '—';
  }

  return value.toLocaleString(
    'en-US',
    {
      maximumFractionDigits: 0,
    }
  );
}

export default function TokenPage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const [mint, setMint] =
    useState('');

  const [token, setToken] =
    useState<TokenData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    const loadToken = async () => {
      try {
        const resolved =
          await params;

        if (cancelled) {
          return;
        }

        setMint(resolved.mint);

        const response =
          await fetch(
            `/api/token?mint=${encodeURIComponent(
              resolved.mint
            )}`
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to load token.'
          );
        }

        if (!data.mint) {
          throw new Error(
            'Token was not found.'
          );
        }

        if (!cancelled) {
          setToken(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load token.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadToken();

    return () => {
      cancelled = true;
    };
  }, [params]);

  const openTrading = () => {
    window.location.href =
      `/?token=${encodeURIComponent(
        mint
      )}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      alert('Token link copied');
    } catch {
      alert('Copy failed');
    }
  };

  if (loading) {
    return (
      <main className="token-page">
        <div className="token-card">
          <span className="eyebrow">
            MOONPAD
          </span>

          <h1>
            Loading token...
          </h1>

          <p>
            Reading live Solana market
            data.
          </p>
        </div>
      </main>
    );
  }

  if (error || !token) {
    return (
      <main className="token-page">
        <div className="token-card">
          <span className="eyebrow">
            MOONPAD
          </span>

          <h1>
            Token not found
          </h1>

          <p>
            {error ||
              'This token could not be loaded.'}
          </p>

          <button
            onClick={() =>
              (window.location.href = '/')
            }
          >
            Back to MoonPad
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="token-page">
      <div className="token-shell">
        <header className="token-header">
          <div>
            <span className="eyebrow">
              MOONPAD TOKEN
            </span>

            <h1>
              {token.name ||
                token.symbol ||
                'Token'}
            </h1>

            <p>
              $
              {token.symbol ||
                'TOKEN'}
            </p>
          </div>

          {token.image && (
            <img
              src={token.image}
              alt={
                token.name ||
                token.symbol ||
                'Token'
              }
              className="token-image"
            />
          )}
        </header>

        <section className="token-price-card">
          <span className="eyebrow">
            LIVE PRICE
          </span>

          <strong>
            {formatUsd(
              token.priceUsd
            )}
          </strong>

          {token.priceChange24h !==
            null &&
            token.priceChange24h !==
              undefined && (
              <span>
                24h:{' '}
                {token.priceChange24h >=
                0
                  ? '+'
                  : ''}
                {token.priceChange24h}%
              </span>
            )}
        </section>

        <section className="token-stats">
          <div>
            <span>
              MARKET CAP
            </span>
            <strong>
              $
              {formatNumber(
                token.marketCap
              )}
            </strong>
          </div>

          <div>
            <span>
              LIQUIDITY
            </span>
            <strong>
              $
              {formatNumber(
                token.liquidity
              )}
            </strong>
          </div>

          <div>
            <span>
              24H VOLUME
            </span>
            <strong>
              $
              {formatNumber(
                token.volume24h
              )}
            </strong>
          </div>

          <div>
            <span>
              FDV
            </span>
            <strong>
              $
              {formatNumber(
                token.fdv
              )}
            </strong>
          </div>
        </section>

        <section className="token-actions">
          <button
            className="primary"
            onClick={
              openTrading
            }
          >
            Trade on MoonPad
          </button>

          <button
            className="secondary"
            onClick={
              copyLink
            }
          >
            Copy Token Link
          </button>
        </section>

        <section className="token-details">
          <span className="eyebrow">
            TOKEN DETAILS
          </span>

          <div>
            <span>
              Mint
            </span>

            <code>
              {token.mint}
            </code>
          </div>

          {token.dex && (
            <div>
              <span>
                DEX
              </span>

              <strong>
                {token.dex}
              </strong>
            </div>
          )}

          {token.pairAddress && (
            <div>
              <span>
                Pair
              </span>

              <code>
                {token.pairAddress}
              </code>
            </div>
          )}
        </section>

        <footer>
          MoonPad · Solana Mainnet
        </footer>
      </div>
    </main>
  );
}
